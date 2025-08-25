import { Controller, Get, Query } from '@nestjs/common';
import { LagService } from './lag.service.js';
import { LagQueryDto } from './dtos/lag-query.dto.js';
import { LagResultDto } from './dtos/lag-result.dto.js';
import { DatabaseSizeDto } from './dtos/database-size.dto.js';

@Controller('lag')
export class LagController {
  constructor(private readonly lagService: LagService) {}

  @Get()
  async getLag(@Query() query: LagQueryDto): Promise<LagResultDto[]> {
    return this.lagService.calculateLag(new Date(query.from), new Date(query.to));
  }

  @Get('size')
  async getDatabaseSize(): Promise<DatabaseSizeDto> {
    return this.lagService.getDatabaseSize();
  }
}
