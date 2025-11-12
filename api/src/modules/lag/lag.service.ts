import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MtrBatch } from '../../entities/mtr_batch.entity.js';
import { EntityToDtoService } from './entity-to-dto.service.js';
import { LagResultDto, LagHubResultDto } from './dtos/lag-result.dto.js';
import { DatabaseSizeDto } from './dtos/database-size.dto.js';
import { DownsampleResultDto } from './dtos/downsample-result.dto.js';

@Injectable()
export class LagService {
  constructor(
    @InjectRepository(MtrBatch)
    private readonly mtrBatchRepository: Repository<MtrBatch>,
    private readonly entityToDtoService: EntityToDtoService,
  ) {}

  async calculateLag(from: Date, to: Date): Promise<LagResultDto[]> {
    // Query batches between the specified timestamps
    const batches = await this.mtrBatchRepository.find({
      where: {
        createdAt: Between(from, to),
      },
      relations: ['results'],
    });

    // Convert entities to DTOs using the entity-to-dto service
    return batches.map(batch => this.entityToDtoService.batchToDto(batch));
  }

  async getDatabaseSize(): Promise<DatabaseSizeDto> {
    const result = await this.mtrBatchRepository.query(`
      SELECT pg_database_size(current_database()) as size;
    `);
    return {
      bytes: parseInt(result[0]?.size || '0', 10),
    };
  }

  /**
   * Downsample lag data by aggregating batches into automatically sized time buckets.
   * Bucket size (minutes) is computed so that bucket count <= MAX_BUCKETS
   * @param from start time
   * @param to end time
   */
  async getDownsampledLag(from: Date, to: Date): Promise<DownsampleResultDto[]> {
    const MAX_BUCKETS = 50;
    // Clamp start to earliest existing batch using TypeORM query builder (indexed MIN scan).
    const earliestRaw = await this.mtrBatchRepository
      .createQueryBuilder('b')
      .select('MIN(b.createdAt)', 'earliest')
      .getRawOne<{ earliest: Date | string | null }>();
    if (earliestRaw?.earliest) {
      const earliestDate = new Date(earliestRaw.earliest);
      if (earliestDate.getTime() > from.getTime()) {
        from = earliestDate;
      }
    }

    const diffMsRaw = to.getTime() - from.getTime();
    if (diffMsRaw <= 0) {
      return [];
    }
  const diffMinutes = diffMsRaw / 60_000;
  const bucketMinutes = Math.max(1, Math.ceil(diffMinutes / MAX_BUCKETS));
  const bucketSeconds = bucketMinutes * 60;
  const bucketMs = bucketMinutes * 60_000; // duration of each bucket in ms

    // Perform aggregation in the database to avoid loading all rows into memory.
    const sql = `
      SELECT
        to_timestamp(floor(extract(epoch from b.created_at) / $3) * $3) AS bucket_start,
        r.hub_index AS "hubIndex",
        SUM(r.sent) AS sent,
        SUM(r.lost) AS lost,
        AVG(r.average_ms) AS "averageMs",
        MIN(r.best_ms) AS "bestMs",
        MAX(r.worst_ms) AS "worstMs",
        AVG(r.standard_deviation_ms) AS "standardDeviationMs",
        SUM(b.test_count) AS "testCount",
        AVG(b.packet_size) AS "packetSize"
      FROM mtr_batch b
      JOIN mtr_results r ON r."batchId" = b.id
      WHERE b.created_at BETWEEN $1 AND $2
      GROUP BY bucket_start, r.hub_index
      ORDER BY bucket_start ASC, r.hub_index ASC;
    `;

    const rows: Array<{
      bucket_start: string;
      hubIndex: number;
      sent: string | number;
      lost: string | number;
      averageMs: string | number;
      bestMs: string | number;
      worstMs: string | number;
      standardDeviationMs: string | number;
      testCount: string | number;
      packetSize: string | number;
    }> = await this.mtrBatchRepository.query(sql, [from.toISOString(), to.toISOString(), bucketSeconds]);

    // Group aggregated rows by bucket_start
    const bucketMap = new Map<string, { testCount: number; packetSize: number; hubResults: LagHubResultDto[] }>();
    for (const r of rows) {
      const key = r.bucket_start;
      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          testCount: Number(r.testCount) || 0,
          packetSize: Math.round(Number(r.packetSize) || 0),
          hubResults: [],
        });
      } else {
        // Preserve existing testCount/packetSize (take first) to avoid hub duplication inflation.
        const existing = bucketMap.get(key)!;
        existing.testCount = Number(r.testCount) || existing.testCount;
        existing.packetSize = Math.round(Number(r.packetSize) || existing.packetSize);
      }
      const hubResult: LagHubResultDto = {
        hubIndex: r.hubIndex,
        sent: Number(r.sent) || 0,
        lost: Number(r.lost) || 0,
        averageMs: Number(r.averageMs) || 0,
        bestMs: Number(r.bestMs) || 0,
        worstMs: Number(r.worstMs) || 0,
        standardDeviationMs: Number(r.standardDeviationMs) || 0,
      };
      bucketMap.get(key)!.hubResults.push(hubResult);
    }

    // Convert existing buckets to ordered array
    const existing: DownsampleResultDto[] = Array.from(bucketMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([bucketStart, v]) => {
        const startDate = new Date(bucketStart);
        // Tentative end is start + bucketMs; cap at requested 'to' to avoid overshoot.
        const tentativeEnd = startDate.getTime() + bucketMs;
        const cappedEnd = Math.min(tentativeEnd, to.getTime());
        return {
          bucketStart: startDate,
          bucketEnd: new Date(cappedEnd),
          testCount: v.testCount,
          packetSize: v.packetSize,
          results: v.hubResults,
        };
      });

    // Fill missing buckets from floor(from) to ceil(to) stepping bucketMinutes.
    const startTs = Math.floor(from.getTime() / bucketMs) * bucketMs;
    const endTsExclusive = Math.ceil(to.getTime() / bucketMs) * bucketMs; // include partial last

    const existingMap = new Map<number, DownsampleResultDto>();
    for (const r of existing) {
      existingMap.set(r.bucketStart.getTime(), r);
    }

    const filled: DownsampleResultDto[] = [];
    for (let ts = startTs; ts < endTsExclusive; ts += bucketMs) {
      const found = existingMap.get(ts);
      if (found) {
        filled.push(found);
      } else {
        const bucketStart = new Date(ts);
        const tentativeEnd = ts + bucketMs;
        const cappedEnd = Math.min(tentativeEnd, to.getTime());
        filled.push({
          bucketStart,
          bucketEnd: new Date(cappedEnd),
          testCount: 0,
          packetSize: 0,
          results: [],
        });
      }
    }

    return filled;
  }
}
