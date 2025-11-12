import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { LagController, MAX_RAW_RANGE_HOURS } from './lag.controller.js';

describe('LagController raw range limit', () => {
  it('throws BadRequestException when range exceeds limit', async () => {
    const mockService = { calculateLag: vi.fn() } as { calculateLag: () => Promise<unknown> };
    const controller = new LagController(mockService as any);
    const from = new Date('2025-01-01T00:00:00.000Z');
    const to = new Date(from.getTime() + (MAX_RAW_RANGE_HOURS + 1) * 3600 * 1000);

    await expect(
      controller.getLag({ from: from.toISOString(), to: to.toISOString() } as any)
    ).rejects.toThrow(BadRequestException);
  });

  it('allows range at or under limit', async () => {
    const mockResult: unknown[] = [];
    const mockService = { calculateLag: vi.fn().mockResolvedValue(mockResult) } as { calculateLag: () => Promise<unknown[]> };
    const controller = new LagController(mockService as any);
    const from = new Date('2025-01-01T00:00:00.000Z');
    const to = new Date(from.getTime() + (MAX_RAW_RANGE_HOURS) * 3600 * 1000);

    await expect(
      controller.getLag({ from: from.toISOString(), to: to.toISOString() } as any)
    ).resolves.toBe(mockResult);
    expect(mockService.calculateLag).toHaveBeenCalledOnce();
  });
});
