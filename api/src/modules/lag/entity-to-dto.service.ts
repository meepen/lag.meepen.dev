import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { createHash } from 'crypto';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';
import { MtrResult } from '../../entities/mtr_result.entity.js';
import { LagResultDto, LagHubResultDto } from './dtos/lag-result.dto.js';

@Injectable()
export class EntityToDtoService {
  batchToDto(batch: MtrBatch): LagResultDto {
    return plainToInstance(LagResultDto, {
      batchId: batch.id,
      createdAt: batch.createdAt,
      sourceName: batch.sourceName,
      destinationName: batch.destinationName,
      testCount: batch.testCount,
      packetSize: batch.packetSize,
      results: batch.results ? this.resultsToDto(batch.results) : [],
    });
  }

  private resultsToDto(results: MtrResult[]): LagHubResultDto[] {
    return results.map(result => 
      plainToInstance(LagHubResultDto, {
        hubIndex: result.hubIndex,
        hostHash: this.hashHost(result.host),
        sent: result.sent,
        lost: result.lost,
        averageMs: result.averageMs,
        bestMs: result.bestMs,
        worstMs: result.worstMs,
        standardDeviationMs: result.standardDeviationMs,
      })
    );
  }

  private hashHost(host: string): string {
    return createHash('sha256').update(host).digest('hex');
  }
}
