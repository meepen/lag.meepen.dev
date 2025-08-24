import { faker } from '@faker-js/faker';
import { MtrBatch } from './mtr_batch.entity.js';
import { mockMtrResult } from './mtr_result.entity.mock.js';
import { MtrResult } from './mtr_result.entity.js';

export function mockMtrBatch(overrides: Partial<MtrBatch> = {}): MtrBatch {
  const batch = new MtrBatch();
  
  batch.id = faker.string.uuid();
  batch.createdAt = faker.date.recent();
  batch.sourceName = faker.internet.ip();
  batch.destinationName = faker.internet.ip();
  batch.testCount = faker.number.int({ min: 1, max: 100 });
  batch.packetSize = faker.number.int({ min: 32, max: 1500 });
  
  return Object.assign(batch, overrides);
}

export function mockMtrBatchWithResults(resultCount = 5, batchOverrides: Partial<MtrBatch> = {}, resultOverrides: Partial<MtrResult> = {}): MtrBatch {
  const batch = mockMtrBatch(batchOverrides);
  const results = new Array(resultCount).fill(null).map(() => {
    const result = mockMtrResult(resultOverrides);
    result.batch = batch;
    return result;
  });
  
  batch.results = results;
  return batch;
}
