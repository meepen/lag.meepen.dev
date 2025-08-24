import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';
import { MtrResultDto } from './dtos/mtr-result.dto.js';
import { DtoToEntityService } from './dto-to-entity.service.js';

@Injectable()
export class DataloaderService {
  constructor(
    @InjectRepository(MtrBatch)
    private readonly mtrBatchRepository: Repository<MtrBatch>,
    private readonly dtoToEntityService: DtoToEntityService,
  ) {}

  async addMtrResult(data: MtrResultDto) {
    // Convert DTO to batch entity with results already attached
    const batch = this.dtoToEntityService.dtoToBatch(data);
    
    // Save batch with cascade - this will save both batch and results in one transaction
    const savedBatch = await this.mtrBatchRepository.save(batch);
    
    return {
      success: true, 
      batchId: savedBatch.id,
      results: savedBatch.results.map(r => r.id) 
    };
  }
}
