import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';

@Injectable()
export class LagService {
  constructor(
    @InjectRepository(MtrBatch)
    private readonly mtrBatchRepository: Repository<MtrBatch>,
  ) {}

  async calculateLag(from: Date, to: Date): Promise<string> {
    // Query batches between the specified timestamps
    const batches = await this.mtrBatchRepository.find({
      where: {
        createdAt: Between(from, to),
      },
      relations: ['results'],
    });

    // Stubbed lag calculation logic with actual data query
    return `Found ${batches.length} batches between ${from.toISOString()} and ${to.toISOString()} - implement lag calculation logic here`;
  }
}
