import { LagHubResultDto } from "./lag-result.dto.js";

export interface DownsampleResultDto {
  bucketStart: Date; // converted to Date after fetch
  bucketEnd: Date; // converted to Date after fetch (exclusive upper bound)
  collector: string;
  testCount: number;
  packetSize: number;
  results: LagHubResultDto[];
}
