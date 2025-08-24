import { describe, it, expect, beforeEach, vitest } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DtoToEntityService } from './dto-to-entity.service.js';
import { AppLogger } from '../../common/logger/app-logger.service.js';
import { INQUIRER } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { MtrResultDto } from './dtos/mtr-result.dto.js';
import { mockMtrBatchWithResults } from '../../entities/mtr_batch.entity.mock.js';
import { Logger } from '@nestjs/common';

describe('DtoToEntityService', () => {
  let service: DtoToEntityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DtoToEntityService,
        {
          provide: AppLogger,
          useValue: new Logger(),
        }
      ],
    }).compile();

    service = module.get<DtoToEntityService>(DtoToEntityService);
  });

  it('should convert entity back to DTO and then to entity with equality', () => {
    // Create a mock entity
    const mockEntity = mockMtrBatchWithResults();
    
    // Manually map entity to DTO structure
    const mockDtoPlain = {
      report: {
        mtr: {
          src: mockEntity.sourceName,
          dst: mockEntity.destinationName,
          tos: 0,
          tests: mockEntity.testCount,
          psize: mockEntity.packetSize.toString(),
          bitpattern: '0x00'
        },
        hubs: mockEntity.results.map((result, index) => ({
          count: index + 1,
          host: result.host,
          'Loss%': result.lost,
          Snt: result.sent,
          Last: result.averageMs, // Using average as last for simplicity
          Avg: result.averageMs,
          Best: result.bestMs,
          Wrst: result.worstMs,
          StDev: result.standardDeviationMs
        }))
      }
    };
    
    const mockDto = plainToInstance(MtrResultDto, mockDtoPlain);
    
    // Convert DTO back to entity using service
    const resultEntity = service.dtoToBatch(mockDto);
    
    // Check recursive equality of relevant fields
    expect(resultEntity).toMatchObject({
      sourceName: mockEntity.sourceName,
      destinationName: mockEntity.destinationName,
      testCount: mockEntity.testCount,
      packetSize: mockEntity.packetSize
    });
    
    // Check that the batch results array has the correct length
    expect(resultEntity.results).toHaveLength(mockEntity.results.length);
  });
});
