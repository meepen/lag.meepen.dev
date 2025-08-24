import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataloaderController } from './dataloader.controller.js';
import { DataloaderService } from './dataloader.service.js';
import { ApiSecretGuard } from './api-secret.guard.js';
import { DtoToEntityService } from './dto-to-entity.service.js';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';
import { MtrResult } from '../../entities/mtr_result.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([MtrBatch, MtrResult])],
  controllers: [DataloaderController],
  providers: [DataloaderService, ApiSecretGuard, DtoToEntityService],
})
export class DataloaderModule {}
