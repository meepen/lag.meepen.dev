import { IsArray, IsInt, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MtrDto {
  @IsString()
  src!: string;

  @IsString()
  dst!: string;

  @IsInt()
  tos!: number;

  @IsInt()
  tests!: number;

  @IsString()
  psize!: string;

  @IsString()
  bitpattern!: string;
}

export class MtrHubDto {
  @IsInt()
  count!: number;

  @IsString()
  host!: string;

  @IsNumber()
  ['Loss%']!: number;

  @IsInt()
  Snt!: number;

  @IsNumber()
  Last!: number;

  @IsNumber()
  Avg!: number;

  @IsNumber()
  Best!: number;

  @IsNumber()
  Wrst!: number;

  @IsNumber()
  StDev!: number;
}

class MtrReportDto {
  @ValidateNested()
  @Type(() => MtrDto)
  mtr!: MtrDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MtrHubDto)
  hubs!: MtrHubDto[];
}

export class MtrResultDto {
  @ValidateNested()
  @Type(() => MtrReportDto)
  report!: MtrReportDto;
}
