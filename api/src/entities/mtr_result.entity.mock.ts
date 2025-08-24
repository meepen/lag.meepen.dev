import { faker } from '@faker-js/faker';
import { MtrResult } from './mtr_result.entity.js';

export function mockMtrResult(overrides: Partial<MtrResult> = {}): MtrResult {
  const result = new MtrResult();
  
  result.id = faker.string.uuid();
  result.hubIndex = faker.number.int({ min: 1, max: 30 });
  result.host = faker.internet.domainName();
  result.sent = faker.number.int({ min: 1, max: 100 });
  result.lost = faker.number.int({ min: 0, max: 10 });
  result.averageMs = faker.number.float({ min: 0, max: 100, fractionDigits: 3 });
  result.bestMs = faker.number.float({ min: 0, max: 100, fractionDigits: 3 });
  result.worstMs = faker.number.float({ min: 0, max: 100, fractionDigits: 3 });
  result.standardDeviationMs = faker.number.float({ min: 0, max: 10, fractionDigits: 3 });
  
  return Object.assign(result, overrides);
}
