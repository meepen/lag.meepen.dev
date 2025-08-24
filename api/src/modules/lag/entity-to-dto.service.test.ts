import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityToDtoService } from './entity-to-dto.service.js';
import { createHash } from 'crypto';
import { mockMtrBatchWithResults } from '../../entities/mtr_batch.entity.mock.js';

describe('EntityToDtoService', () => {
  let service: EntityToDtoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntityToDtoService],
    }).compile();

    service = module.get<EntityToDtoService>(EntityToDtoService);
  });

  it('should convert entity to DTO with hashed hosts', () => {
    // Create a mock entity
    const mockEntity = mockMtrBatchWithResults();
    
    // Convert entity to DTO using service
    const resultDto = service.batchToDto(mockEntity);
    
    // Check that basic fields are mapped correctly
    expect(resultDto).toMatchObject({
      batchId: mockEntity.id,
      createdAt: mockEntity.createdAt,
      testCount: mockEntity.testCount,
      packetSize: mockEntity.packetSize,
    });

    // Check that results array is populated
    expect(resultDto.results).toHaveLength(mockEntity.results.length);

    // Check that each result has the correct structure and hashed host
    mockEntity.results.forEach((originalResult, index) => {
      const dtoResult = resultDto.results[index];
      const expectedHostHash = createHash('sha256').update(originalResult.host).digest('hex');
      
      expect(dtoResult).toMatchObject({
        hubIndex: originalResult.hubIndex,
        hostHash: expectedHostHash,
        sent: originalResult.sent,
        lost: originalResult.lost,
        averageMs: originalResult.averageMs,
        bestMs: originalResult.bestMs,
        worstMs: originalResult.worstMs,
        standardDeviationMs: originalResult.standardDeviationMs
      });

      // Ensure original host is not exposed
      expect(dtoResult).not.toHaveProperty('host');
    });
  });

  it('should handle entity with no results', () => {
    // Create a mock entity without results
    const mockEntity = mockMtrBatchWithResults();
    mockEntity.results = [];
    
    // Convert entity to DTO using service
    const resultDto = service.batchToDto(mockEntity);
    
    // Check that results array is empty
    expect(resultDto.results).toHaveLength(0);
    expect(resultDto.results).toEqual([]);
  });
});
