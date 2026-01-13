export class LagResultDto {
  batchId!: string;
  createdAt!: Date;
  testCount!: number;
  packetSize!: number;
  results!: LagHubResultDto[];
}

export class LagHubResultDto {
  hubIndex!: number;
  sent!: number;
  lost!: number;
  averageMs!: number;
  bestMs!: number;
  worstMs!: number;
  standardDeviationMs!: number;
  p95Ms!: number;
  p99Ms!: number;
}
