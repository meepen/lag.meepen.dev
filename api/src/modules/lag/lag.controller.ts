import { Controller, Get, Query } from '@nestjs/common';
import { LagService } from './lag.service.js';
import { LagQueryDto } from './dtos/lag-query.dto.js';

@Controller('lag')
export class LagController {
  constructor(private readonly lagService: LagService) {}

  @Get()
  async getLag(@Query() query: LagQueryDto): Promise<string> {
    return this.lagService.calculateLag(new Date(query.from), new Date(query.to));
  }
}
