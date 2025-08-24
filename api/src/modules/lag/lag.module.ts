import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LagService } from './lag.service.js';
import { LagController } from './lag.controller.js';
import { EntityToDtoService } from './entity-to-dto.service.js';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';
import { MtrResult } from '../../entities/mtr_result.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([MtrBatch, MtrResult])],
  controllers: [LagController],
  providers: [LagService, EntityToDtoService],
})
export class LagModule {}
