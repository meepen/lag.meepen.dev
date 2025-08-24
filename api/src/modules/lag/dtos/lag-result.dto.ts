export class LagResultDto {
  batchId!: string;
  createdAt!: Date;
  sourceName!: string;
  destinationName!: string;
  testCount!: number;
  packetSize!: number;
  results!: LagHubResultDto[];
}

export class LagHubResultDto {
  hubIndex!: number;
  hostHash!: string;
  sent!: number;
  lost!: number;
  averageMs!: number;
  bestMs!: number;
  worstMs!: number;
  standardDeviationMs!: number;
}
