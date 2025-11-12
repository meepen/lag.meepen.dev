import { IsISO8601 } from 'class-validator';
import { IsValidDateRange } from './decorators/is-valid-date-range.decorator.js';

export class DownsampleQueryDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  @IsValidDateRange('from', 'to', { message: 'from/to must be valid ISO8601 strings and from < to' })
  to!: string;
}
