import { Hono } from "hono";
import { getDb, type Env } from "../db";
import { mtrBatch } from "@lag.meepen.dev/schema";
import { and, gte, lte, sql } from "drizzle-orm";
import {
  LagResultDto,
  type DownsampleResultDto,
  type LagHubResultDto,
  type UptimeDto,
} from "@lag.meepen.dev/api-schema";

export const lag = new Hono<{ Bindings: Env }>();
lag.onError((err, c) => {
  console.error("Unhandled Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

async function getUptimeStats(
  db: ReturnType<typeof getDb>,
  from: Date,
  to: Date,
  threshold: number,
): Promise<UptimeDto> {
  const bucketSizeSeconds = 15 * 60; // 15 minutes
  const query = sql`
    WITH bucket_stats AS (
      SELECT 
        to_timestamp(floor(extract(epoch from b.created_at) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}) as bucket,
        max(r.worst_ms) as max_latency,
        sum(r.lost) as total_lost,
        sum(r.sent) as total_sent
      FROM mtr_batch b
      JOIN mtr_results r ON r."batchId" = b.id
      WHERE b.created_at >= ${from.toISOString()} 
      AND b.created_at <= ${to.toISOString()}
      GROUP BY 1
    )
    SELECT
      count(bucket)::int as total,
      count(bucket) FILTER (
        WHERE max_latency > ${threshold} 
        OR (total_sent > 0 AND total_lost::float / total_sent > 0.8)
      )::int as bad
    FROM bucket_stats
  `;

  const res = await db.execute<{ total: number; bad: number }>(query);
  const row = res[0];
  const total = row.total;
  const bad = row.bad;

  const uptimePercentage = total > 0 ? ((total - bad) / total) * 100 : 0;
  const unusuablePercentage = total > 0 ? (bad / total) * 100 : 0;

  return {
    startedAt: from.toISOString(),
    endedAt: to.toISOString(),
    uptimePercentage,
    unusuablePercentage,
  };
}

const MAX_RAW_RANGE_HOURS = 24;

lag.get("/uptime", async (c) => {
  const fromStr = c.req.query("from") || "2020-01-01";
  const toStr = c.req.query("to") || new Date().toISOString();
  const thresholdStr = c.req.query("threshold");

  if (!thresholdStr) {
    return c.json({ error: "Missing threshold parameter" }, 400);
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);
  const threshold = Number(thresholdStr);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return c.json({ error: "Invalid date parameters" }, 400);
  }
  if (isNaN(threshold)) {
    return c.json({ error: "Invalid threshold parameter" }, 400);
  }

  const db = getDb(c.env);
  const stats = await getUptimeStats(db, from, to, threshold);
  return c.json(stats);
});

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

  return c.json(
    batches.map<LagResultDto>((batch) => ({
      batchId: batch.id,
      createdAt: batch.createdAt,
      testCount: batch.testCount,
      packetSize: batch.packetSize,
      results: batch.results.map<LagHubResultDto>((result) => ({
        hubIndex: result.hubIndex,
        sent: result.sent,
        lost: result.lost,
        averageMs: result.averageMs,
        bestMs: result.bestMs,
        worstMs: result.worstMs,
        standardDeviationMs: result.standardDeviationMs,
        p95Ms: 0,
        p99Ms: 0,
      })),
    })),
  );
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
  const earliestRes = await db.execute<{ earliest: string }>(
    sql`SELECT MIN(created_at) as earliest FROM mtr_batch`,
  );
  console.debug(earliestRes);
  const earliestDate = new Date(earliestRes[0].earliest);
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
  const bucketMs = bucketMinutes * 60_000; // duration of each bucket in ms

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
      WHERE b.created_at BETWEEN ${from.toISOString()} AND ${to.toISOString()}
      GROUP BY "bucketStart", r.hub_index
      ORDER BY "bucketStart" ASC, r.hub_index ASC;
    `;

  const rows = (
    await db.execute<{
      bucketStart: string;
      hubIndex: number;
      sent: string;
      lost: string;
      averageMs: string;
      bestMs: string;
      worstMs: string;
      standardDeviationMs: string;
      p95Ms: string;
      p99Ms: string;
      testCount: string;
      packetSize: string;
    }>(query)
  ).values();

  // Group aggregated rows by bucket_start
  const bucketMap = new Map<
    string,
    { testCount: number; packetSize: number; hubResults: LagHubResultDto[] }
  >();
  for (const r of rows) {
    const key = r.bucketStart;
    if (!bucketMap.has(key)) {
      bucketMap.set(key, {
        testCount: Number(r.testCount) || 0,
        packetSize: Math.round(Number(r.packetSize) || 0),
        hubResults: [],
      });
    } else {
      // Preserve existing testCount/packetSize (take first) to avoid hub duplication inflation.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const existing = bucketMap.get(key)!;
      existing.testCount = Number(r.testCount) || existing.testCount;
      existing.packetSize = Math.round(
        Number(r.packetSize) || existing.packetSize,
      );
    }
    const hubResult: LagHubResultDto = {
      hubIndex: r.hubIndex,
      sent: Number(r.sent) || 0,
      lost: Number(r.lost) || 0,
      averageMs: Number(r.averageMs) || 0,
      bestMs: Number(r.bestMs) || 0,
      worstMs: Number(r.worstMs) || 0,
      p95Ms: Number(r.p95Ms) || 0,
      p99Ms: Number(r.p99Ms) || 0,
      standardDeviationMs: Number(r.standardDeviationMs) || 0,
    };
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    bucketMap.get(key)!.hubResults.push(hubResult);
  }

  // Convert existing buckets to ordered array
  const existing: DownsampleResultDto[] = Array.from(bucketMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([bucketStart, v]) => {
      const startDate = new Date(bucketStart);
      // Tentative end is start + bucketMs; cap at requested 'to' to avoid overshoot.
      const tentativeEnd = startDate.getTime() + bucketMs;
      const cappedEnd = Math.min(tentativeEnd, to.getTime());
      return {
        bucketStart: startDate,
        bucketEnd: new Date(cappedEnd),
        testCount: v.testCount,
        packetSize: v.packetSize,
        results: v.hubResults,
      };
    });

  // Fill missing buckets from floor(from) to ceil(to) stepping bucketMinutes.
  const startTs = Math.floor(from.getTime() / bucketMs) * bucketMs;
  const endTsExclusive = Math.ceil(to.getTime() / bucketMs) * bucketMs; // include partial last

  const existingMap = new Map<number, DownsampleResultDto>();
  for (const r of existing) {
    existingMap.set(r.bucketStart.getTime(), r);
  }

  const filled: DownsampleResultDto[] = [];
  for (let ts = startTs; ts < endTsExclusive; ts += bucketMs) {
    const found = existingMap.get(ts);
    if (found) {
      filled.push(found);
    } else {
      const bucketStart = new Date(ts);
      const tentativeEnd = ts + bucketMs;
      const cappedEnd = Math.min(tentativeEnd, to.getTime());
      filled.push({
        bucketStart,
        bucketEnd: new Date(cappedEnd),
        testCount: 0,
        packetSize: 0,
        results: [],
      });
    }
  }

  return c.json(filled);
});
