import { plainToInstance } from "class-transformer";
import { MtrDto, MtrHubDto, MtrResultDto } from "./mtr-result.dto.js";
import { faker } from '@faker-js/faker';

export function mockMtrHubDto(overrides = {}): MtrHubDto {
  return plainToInstance(MtrHubDto, {
    count: faker.number.int({ min: 1, max: 10 }),
    host: faker.internet.domainName(),
    'Loss%': faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    Snt: faker.number.int({ min: 1, max: 100 }),
    Last: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    Avg: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    Best: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    Wrst: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    StDev: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
    ...overrides
  });
}

export function mockMtrDto(overrides: Partial<MtrDto> = {}): MtrDto {
  return plainToInstance(MtrDto, {
    src: faker.internet.ip(),
    dst: faker.internet.ip(),
    tos: faker.number.int({ min: 0, max: 255 }),
    tests: faker.number.int({ min: 1, max: 100 }),
    psize: faker.number.int({ min: 32, max: 1500 }).toString(),
    bitpattern: faker.number.int({ min: 0, max: 255 }).toString(),
    ...overrides
  });
}

export function mockMtrResultDto(hubs = 1, overrides: Partial<MtrResultDto> = {}): MtrResultDto {
  return plainToInstance(MtrResultDto, {
    report: {
      mtr: mockMtrDto(),
      hubs: new Array(hubs).fill(null).map(() => mockMtrHubDto()),
      ...overrides
    }
  });
}