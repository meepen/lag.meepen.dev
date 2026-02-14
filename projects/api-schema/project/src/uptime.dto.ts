export class UptimeDto {
  startedAt!: string;
  endedAt!: string;
  collector?: string;
  uptimePercentage!: number;
  unusuablePercentage!: number;
}
