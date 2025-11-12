// always update the file in the frontend @ <root>/frontend/src/types/downsample-result.dto.ts as well

import { LagHubResultDto } from './lag-result.dto.js';

export class DownsampleResultDto {
  bucketStart!: Date; // inclusive start timestamp of the aggregated bucket (local time preserved)
  bucketEnd!: Date;   // exclusive end timestamp of the bucket (never exceeds requested 'to')
  testCount!: number; // summed testCount of batches in bucket
  packetSize!: number; // average packet size across batches (rounded)
  results!: LagHubResultDto[]; // aggregated per hub metrics
}
