import { Hono } from "hono";
import { getDb, type Env } from "../db";
import { mtrBatch } from "@lag.meepen.dev/schema";
import { and, gte, lte, sql } from "drizzle-orm";

export const lag = new Hono<{ Bindings: Env }>();
lag.onError((err, c) => {
  console.error("Unhandled Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

const MAX_RAW_RANGE_HOURS = 24;

lag.get("/", async (c) => {
  const fromStr = c.req.query("from");
  const toStr = c.req.query("to");

  if (!fromStr || !toStr) {
    return c.json({ error: "Missing from/to parameters" }, 400);
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return c.json({ error: "Invalid date parameters" }, 400);
  }

  const hours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
  if (hours > MAX_RAW_RANGE_HOURS) {
    return c.json(
      {
        error: `Requested range of ${hours.toFixed(2)}h exceeds raw limit of ${MAX_RAW_RANGE_HOURS}h. Use /lag/downsample instead.`,
        statusCode: 400,
      },
      400,
    );
  }

  const db = getDb(c.env);
  // Fetch batches with results using Drizzle relations
  const batches = await db.query.mtrBatch.findMany({
    where: and(gte(mtrBatch.createdAt, from), lte(mtrBatch.createdAt, to)),
    orderBy: (batch, { asc }) => [asc(batch.createdAt)],
    with: {
      results: {
        orderBy: (results, { asc }) => [asc(results.hubIndex)],
      },
    },
  });

  return c.json(batches);
});

lag.get("/size", async (c) => {
  const db = getDb(c.env);
  const res = await db.execute<{ size: number }>(
    sql`SELECT pg_database_size(current_database()) as size`,
  );
  return c.json({ bytes: res[0].size });
});

lag.get("/downsample", async (c) => {
  const fromStr = c.req.query("from");
  const toStr = c.req.query("to");

  if (!fromStr || !toStr) {
    return c.json({ error: "Missing from/to parameters" }, 400);
  }

  let from = new Date(fromStr);
  const to = new Date(toStr);

  const db = getDb(c.env);
  const MAX_BUCKETS = 50;

  // Get earliest batch to clamp start time
  const earliestRes = await db.execute<{ earliest: Date }>(
    sql`SELECT MIN(created_at) as earliest FROM mtr_batch`,
  );
  const earliestDate = earliestRes[0].earliest;
  if (earliestDate.getTime() > from.getTime()) {
    from = earliestDate;
  }

  const diffMsRaw = to.getTime() - from.getTime();
  if (diffMsRaw <= 0) {
    return c.json([]);
  }

  const diffMinutes = diffMsRaw / 60_000;
  const bucketMinutes = Math.max(1, Math.ceil(diffMinutes / MAX_BUCKETS));
  const bucketSeconds = bucketMinutes * 60;

  const query = sql`
      SELECT
        to_timestamp(floor(extract(epoch from b.created_at) / ${bucketSeconds}) * ${bucketSeconds}) AS "bucketStart",
        r.hub_index AS "hubIndex",
        SUM(r.sent) AS sent,
        SUM(r.lost) AS lost,
        AVG(r.average_ms) AS "averageMs",
        MIN(r.best_ms) AS "bestMs",
        MAX(r.worst_ms) AS "worstMs",
        AVG(r.standard_deviation_ms) AS "standardDeviationMs",
        percentile_cont(0.95) WITHIN GROUP (ORDER BY r.average_ms) AS "p95Ms",
        percentile_cont(0.99) WITHIN GROUP (ORDER BY r.average_ms) AS "p99Ms",
        SUM(b.test_count) AS "testCount",
        AVG(b.packet_size) AS "packetSize"
      FROM mtr_batch b
      JOIN mtr_results r ON r."batchId" = b.id
      WHERE b.created_at BETWEEN ${from} AND ${to}
      GROUP BY "bucketStart", r.hub_index
      ORDER BY "bucketStart" ASC, r.hub_index ASC;
    `;

  const rows = await db.execute(query);

  return c.json(rows);
});
