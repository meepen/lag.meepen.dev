import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { IsISO8601 } from 'class-validator';
import { IsValidDateRange } from './is-valid-date-range.decorator.js';

class TestDto {
  @IsISO8601()
  from!: string;
  @IsISO8601()
  to!: string;
  @IsValidDateRange('from', 'to')
  _range?: string;
}

describe('IsValidDateRange decorator', () => {
  it('accepts valid increasing dates', async () => {
    const dto = new TestDto();
    dto.from = '2025-01-01T00:00:00.000Z';
    dto.to = '2025-01-02T00:00:00.000Z';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects when from equals to', async () => {
    const dto = new TestDto();
    dto.from = '2025-01-01T00:00:00.000Z';
    dto.to = '2025-01-01T00:00:00.000Z';
    const errors = await validate(dto);
    expect(errors.some(e => e.constraints && Object.values(e.constraints).some(msg => msg.includes('earlier')))).toBe(true);
  });

  it('rejects invalid date strings', async () => {
    const dto = new TestDto();
    dto.from = 'not-a-date';
    dto.to = '2025-01-01T00:00:00.000Z';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
