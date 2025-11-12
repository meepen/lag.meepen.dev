// Mirror of backend DownsampleResultDto
// Do NOT import backend code directly – keep frontend isolated.

import { LagHubResultDto } from './lag-result.dto';

export interface DownsampleResultDto {
  bucketStart: Date; // converted to Date after fetch
  bucketEnd: Date;   // converted to Date after fetch (exclusive upper bound)
  testCount: number;
  packetSize: number;
  results: LagHubResultDto[];
}
