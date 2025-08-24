import { Controller, Put, Body, UseGuards } from '@nestjs/common';
import { DataloaderService } from './dataloader.service.js';
import { ApiSecretGuard } from './api-secret.guard.js';
import { MtrResultDto } from './dtos/mtr-result.dto.js';

@UseGuards(ApiSecretGuard)
@Controller('dataloader')
export class DataloaderController {
  constructor(private readonly dataloaderService: DataloaderService) {}

  @Put('mtr-result')
  addMtrResult(@Body() data: MtrResultDto) {
    return this.dataloaderService.addMtrResult(data);
  }
}
