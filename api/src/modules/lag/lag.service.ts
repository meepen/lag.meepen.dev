import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';
import { EntityToDtoService } from './entity-to-dto.service.js';
import { LagResultDto } from './dtos/lag-result.dto.js';
import { DatabaseSizeDto } from './dtos/database-size.dto.js';

@Injectable()
export class LagService {
  constructor(
    @InjectRepository(MtrBatch)
    private readonly mtrBatchRepository: Repository<MtrBatch>,
    private readonly entityToDtoService: EntityToDtoService,
  ) {}

  async calculateLag(from: Date, to: Date): Promise<LagResultDto[]> {
    // Query batches between the specified timestamps
    const batches = await this.mtrBatchRepository.find({
      where: {
        createdAt: Between(from, to),
      },
      relations: ['results'],
    });

    // Convert entities to DTOs using the entity-to-dto service
    return batches.map(batch => this.entityToDtoService.batchToDto(batch));
  }

  async getDatabaseSize(): Promise<DatabaseSizeDto> {
    const result = await this.mtrBatchRepository.query(`
      SELECT pg_database_size(current_database()) as size;
    `);
    return {
      bytes: parseInt(result[0]?.size || '0', 10),
    };
  }
}
