// always update the file in the backend @ <root>/api/src/modules/lag/dtos/lag-result.dto.ts as well

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
}
