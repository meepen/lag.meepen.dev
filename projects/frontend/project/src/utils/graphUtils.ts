import type { LagResultDto, LagHubResultDto } from "../types/lag-result.dto";
import type { DownsampleResultDto } from "../types/downsample-result.dto";

export function formatDateForUrl(date: Date): string {
  return date.toISOString();
}

export function downsampleedToLagResultDtos(
  rows: DownsampleResultDto[],
): (LagResultDto & { bucketStart: Date; bucketEnd: Date })[] {
  return rows.map((row) => ({
    batchId: `bucket-${row.bucketStart.getTime()}`,
    createdAt: row.bucketStart, // keep createdAt for legacy uses
    testCount: row.testCount,
    packetSize: row.packetSize,
    results:
      row.results.length > 0
        ? row.results
        : createAggregateHubResultPlaceholder(),
    bucketStart: row.bucketStart,
    bucketEnd: row.bucketEnd,
  }));
}

export function createAggregateHubResultPlaceholder(): LagHubResultDto[] {
  // If backend did not return per-hub results (shouldn't happen), create single placeholder.
  return [
    {
      hubIndex: -1,
      sent: 0,
      lost: 0,
      averageMs: 0,
      bestMs: 0,
      worstMs: 0,
      standardDeviationMs: 0,
      p95Ms: 0,
      p99Ms: 0,
    },
  ];
}

export function metricLabel(key: string): string {
  switch (key) {
    case "avg":
      return "Average";
    case "min":
      return "Min";
    case "max":
      return "Max";
    case "p95":
      return "p95";
    case "p99":
      return "p99";
    default:
      return key;
  }
}
