import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LagService } from './lag.service.js';
import { LagQueryDto } from './dtos/lag-query.dto.js';
import { LagResultDto } from './dtos/lag-result.dto.js';
import { DatabaseSizeDto } from './dtos/database-size.dto.js';
import { DownsampleQueryDto } from './dtos/downsample-query.dto.js';
import { DownsampleResultDto } from './dtos/downsample-result.dto.js';

// Raw range upper limit (hours). Requests exceeding this must use /lag/downsample.
// If updating this constant, also update RAW_RANGE_LIMIT_HOURS in frontend GraphController.
export const MAX_RAW_RANGE_HOURS = 24;

@Controller('lag')
export class LagController {
  constructor(private readonly lagService: LagService) { }

  @Get()
  async getLag(@Query() query: LagQueryDto): Promise<LagResultDto[]> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    const hours = (to.getTime() - from.getTime()) / 36e5;
    if (hours > MAX_RAW_RANGE_HOURS) {
      throw new BadRequestException(`Requested range of ${hours.toFixed(2)}h exceeds raw limit of ${MAX_RAW_RANGE_HOURS}h. Use /lag/downsample instead.`);
    }
    return this.lagService.calculateLag(from, to);
  }

  @Get('size')
  async getDatabaseSize(): Promise<DatabaseSizeDto> {
    return this.lagService.getDatabaseSize();
  }

  @Get('downsample')
  async getDownsample(@Query() query: DownsampleQueryDto): Promise<DownsampleResultDto[]> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    return this.lagService.getDownsampledLag(from, to);
  }
}
