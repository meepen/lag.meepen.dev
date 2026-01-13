import { Hono } from "hono";
import { getDb, type Env } from "../db";
import { mtrBatch, mtrResult } from "@lag.meepen.dev/schema";

export const dataloader = new Hono<{ Bindings: Env }>();

dataloader.use("*", async (c, next) => {
  const secret = c.req.header("x-api-secret");
  if (!secret || secret !== c.env.API_SECRET) {
    return c.json({ message: "Forbidden" }, 403);
  }
  await next();
});

interface MtrHubDto {
  count: number;
  host: string;
  "Loss%": number;
  Snt: number;
  Last: number;
  Avg: number;
  Best: number;
  Wrst: number;
  StDev: number;
}

interface MtrDto {
  src: string;
  dst: string;
  tos: number;
  tests: number;
  psize: string;
  bitpattern: string;
}

interface MtrResultDto {
  report: {
    mtr: MtrDto;
    hubs: MtrHubDto[];
  };
}

dataloader.put("/mtr-result", async (c) => {
  const data = await c.req.json<MtrResultDto>();

  const db = getDb(c.env);
  const batchId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    const { src, dst, tests, psize } = data.report.mtr;

    // Insert Batch
    await tx.insert(mtrBatch).values({
      id: batchId,
      sourceName: src,
      destinationName: dst,
      testCount: tests,
      packetSize: parseInt(psize, 10),
      createdAt: new Date(),
    });

    // Insert Results
    for (const [idx, hub] of data.report.hubs.entries()) {
      const lost = Math.round((hub["Loss%"] / 100) * hub.Snt);

      await tx.insert(mtrResult).values({
        id: crypto.randomUUID(),
        batchId: batchId,
        hubIndex: idx,
        host: hub.host,
        sent: hub.Snt,
        lost: lost,
        averageMs: hub.Avg,
        bestMs: hub.Best,
        worstMs: hub.Wrst,
        standardDeviationMs: hub.StDev,
      });
    }
  });

  return c.json({
    success: true,
    batchId: batchId,
  });
});
