import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { IsISO8601, IsInt, Min, Max } from 'class-validator';
import { IsValidDateRange } from './is-valid-date-range.decorator.js';
import { MaxBucketCount } from './max-bucket-count.decorator.js';

class BucketDto {
  @IsISO8601() from!: string;
  @IsISO8601() to!: string;
  @IsValidDateRange('from', 'to') _range?: string;
  @IsInt() @Min(1) @Max(1440)
  @MaxBucketCount('from', 'to', 500)
  bucketMinutes!: number;
}

describe('MaxBucketCount decorator', () => {
  const from = '2025-01-01T00:00:00.000Z';
  const to = '2025-01-02T00:00:00.000Z'; // 24h => 1440 minutes

  it('rejects bucketMinutes producing > max buckets', async () => {
    const dto = new BucketDto();
    dto.from = from;
    dto.to = to;
    dto.bucketMinutes = 1; // 1440 buckets
    const errors = await validate(dto);
    expect(errors.some(e => e.constraints && Object.values(e.constraints).some(m => m.includes('Bucket count')))).toBe(true);
  });

  it('accepts bucketMinutes reducing bucket count under limit', async () => {
    const dto = new BucketDto();
    dto.from = from;
    dto.to = to;
    dto.bucketMinutes = 3; // 480 buckets
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
