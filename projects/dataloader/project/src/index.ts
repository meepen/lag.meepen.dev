import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { mtrBatch, mtrResult } from "@lag.meepen.dev/schema";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const envSchema = z.object({
  TARGET_ADDRESS: z.string().min(1),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  MTR_TEST_COUNT: z.coerce.number().int().positive().default(5),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
});

const mtrPayloadSchema = z.object({
  report: z.object({
    mtr: z.object({
      src: z.string(),
      dst: z.string(),
      tests: z.coerce.number(),
      psize: z.coerce.number(),
    }),
    hubs: z.array(
      z.object({
        host: z.string(),
        Snt: z.coerce.number(),
        "Loss%": z.coerce.number(),
        Avg: z.coerce.number(),
        Best: z.coerce.number(),
        Wrst: z.coerce.number(),
        StDev: z.coerce.number(),
      }),
    ),
  }),
});

type MtrPayload = z.infer<typeof mtrPayloadSchema>;

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function runMtr(
  targetAddress: string,
  testCount: number,
): Promise<MtrPayload> {
  const { stdout } = await execFileAsync(
    "mtr",
    ["-j", "-n", "-c", String(testCount), targetAddress],
    {
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  const parsed = JSON.parse(stdout) as unknown;
  return mtrPayloadSchema.parse(parsed);
}

async function main(): Promise<void> {
  const env = envSchema.parse(process.env);

  const url = new URL("postgres://localhost");
  url.username = env.POSTGRES_USER;
  url.password = env.POSTGRES_PASSWORD;
  url.hostname = env.POSTGRES_HOST;
  url.port = env.POSTGRES_PORT;
  url.pathname = `/${env.POSTGRES_DB}`;

  const connection = postgres(url.toString(), { max: 1 });
  const db = drizzle(connection);

  console.log(
    `Waiting for PostgreSQL at ${env.POSTGRES_HOST}:${env.POSTGRES_PORT}...`,
  );
  for (;;) {
    try {
      await connection`select 1`;
      break;
    } catch {
      await sleep(2000);
    }
  }
  console.log("PostgreSQL is ready.");

  for (;;) {
    try {
      console.log(`Running mtr against ${env.TARGET_ADDRESS}...`);
      const payload = await runMtr(env.TARGET_ADDRESS, env.MTR_TEST_COUNT);
      console.log(
        "MTR completed successfully. Inserting data into PostgreSQL...",
      );

      const insertedBatchId = await db.transaction(async (tx) => {
        const mtrInfo = payload.report.mtr;
        const [batch] = await tx
          .insert(mtrBatch)
          .values({
            sourceName: mtrInfo.src,
            destinationName: mtrInfo.dst,
            testCount: mtrInfo.tests,
            packetSize: mtrInfo.psize,
          })
          .returning({ id: mtrBatch.id });

        const rows = payload.report.hubs.map((hub, index) => {
          const sent = hub.Snt;
          const lossPercent = hub["Loss%"];
          const lost = Math.round((lossPercent / 100) * sent);

          return {
            batchId: batch.id,
            hubIndex: index,
            host: hub.host,
            sent,
            lost,
            averageMs: hub.Avg,
            bestMs: hub.Best,
            worstMs: hub.Wrst,
            standardDeviationMs: hub.StDev,
          };
        });

        if (rows.length > 0) {
          await tx.insert(mtrResult).values(rows);
        }

        return batch.id;
      });

      console.log(
        `Inserted batch ${insertedBatchId} and associated mtr_results rows`,
      );
    } catch (error) {
      console.error("Dataloader cycle failed:", error);
    }

    await sleep(env.POLL_INTERVAL_MS);
  }
}

await main();
