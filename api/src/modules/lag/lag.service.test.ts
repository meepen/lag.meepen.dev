import { describe, it, expect } from 'vitest';
import { LagService } from './lag.service.js';

// Minimal mocks for repository and dependencies
class MockRepository {
  async find() { return []; }
  async query(_sql: string, _params: any[]) {
    // Return a single bucket in the middle of range
    return [
      {
        bucket_start: '2025-01-01T00:05:00.000Z',
        hubIndex: 1,
        sent: 10,
        lost: 0,
        averageMs: 50,
        bestMs: 40,
        worstMs: 60,
        standardDeviationMs: 5,
        testCount: 10,
        packetSize: 64,
      },
    ];
  }
  // Minimal createQueryBuilder mock to satisfy LagService.getDownsampledLag earliest scan
  createQueryBuilder(_alias: string) {
    const qb = {
      select: (_selection: string, _alias?: string) => qb,
      // Return an earliest date equal to the provided test range start so clamping logic is exercised but no shift.
      async getRawOne<T>() {
        return { earliest: '2025-01-01T00:00:00.000Z' } as unknown as T;
      },
    };
    return qb;
  }
}

class MockEntityToDtoService {}

describe('LagService bucket fill (auto bucket size)', () => {
  describe('getDownsampledLag', () => {
    it('fills missing buckets with placeholders using computed bucket size', async () => {
      const repo = new MockRepository() as any;
      const svc = new LagService(repo, new MockEntityToDtoService() as any);
      const from = new Date('2025-01-01T00:00:00.000Z');
      const to = new Date('2025-01-01T00:15:00.000Z');
      // Auto bucket size should be 1 minute (15 < 500) -> expect buckets 00:00..00:14
      const result = await svc.getDownsampledLag(from, to);
      expect(result).toHaveLength(15);
      const times = result.map(r => r.bucketStart.toISOString());
      expect(times[0]).toBe('2025-01-01T00:00:00.000Z');
      expect(times[5]).toBe('2025-01-01T00:05:00.000Z');
      expect(times[14]).toBe('2025-01-01T00:14:00.000Z');
      // Find bucket with data
      const dataBucket = result.find(r => r.testCount === 10);
      expect(dataBucket?.bucketStart.toISOString()).toBe('2025-01-01T00:05:00.000Z');
      // Verify empty bucket structure
      const emptyBucket = result[0];
      expect(emptyBucket.testCount).toBe(0);
      expect(emptyBucket.results).toHaveLength(0);
    });
  });
});