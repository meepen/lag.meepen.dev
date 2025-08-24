import { Injectable } from '@nestjs/common';
import { MtrResultDto } from './dtos/mtr-result.dto.js';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';
import { MtrResult } from '../../entities/mtr_result.entity.js';
import { AppLogger } from '../../common/logger/app-logger.service.js';

@Injectable()
export class DtoToEntityService {
  constructor(private readonly logger: AppLogger) {}

  dtoToBatch(dto: MtrResultDto): MtrBatch {
    const batch = new MtrBatch();
    batch.sourceName = dto.report.mtr.src;
    batch.destinationName = dto.report.mtr.dst;
    batch.testCount = dto.report.mtr.tests;
    batch.packetSize = parseInt(dto.report.mtr.psize, 10);
    // createdAt is handled by DB
    
    // Convert and attach results
    batch.results = this.dtoToResults(dto, batch);
    
    return batch;
  }

  private dtoToResults(dto: MtrResultDto, batch: MtrBatch): MtrResult[] {
    this.logger?.debug(dto.report.hubs.length);
    return dto.report.hubs.map((hub, idx) => {
      this.logger?.debug(`Processing hub ${idx}: ${hub.host}`);

      const result = new MtrResult();
      result.batch = batch;
      result.hubIndex = idx;
      result.host = hub.host;
      result.sent = hub.Snt;
      result.lost = Math.round(hub['Loss%'] * result.sent);
      result.averageMs = hub.Avg;
      result.bestMs = hub.Best;
      result.worstMs = hub.Wrst;
      result.standardDeviationMs = hub.StDev;
      return result;
    });
  }
}
