import { Injectable } from '@nestjs/common';
import { MtrResultDto } from './dtos/mtr-result.dto.js';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';
import { MtrResult } from '../../entities/mtr_result.entity.js';

@Injectable()
export class DtoToEntityService {
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
    return dto.report.hubs.map((hub, idx) => {
      const result = new MtrResult();
      result.batch = batch;
      result.hubIndex = idx;
      result.host = hub.host;
      result.sent = hub.Snt;
      result.lost = hub['Loss%'];
      result.averageMs = hub.Avg;
      result.bestMs = hub.Best;
      result.worstMs = hub.Wrst;
      result.standardDeviationMs = hub.StDev;
      return result;
    });
  }
}
