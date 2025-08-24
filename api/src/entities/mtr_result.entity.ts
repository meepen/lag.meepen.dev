
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { MtrBatch } from './mtr_batch.entity.js';
import type { Relation } from 'typeorm';
import { Index } from 'typeorm';

@Entity('mtr_results')
@Index('idx_mtr_results_batch_id', ['batch'])
@Index('idx_mtr_results_hub_index_host', ['hubIndex', 'host'])
export class MtrResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => MtrBatch, (batch) => batch.results)
  batch!: Relation<MtrBatch>;

  @Column({ name: 'hub_index', type: 'int' })
  hubIndex!: number;

  @Column({ name: 'host', type: 'varchar' })
  host!: string;

  @Column({ name: 'sent', type: 'int' })
  sent!: number;

  @Column({ name: 'lost', type: 'int' })
  lost!: number;

  @Column({ name: 'average_ms', type: 'float' })
  averageMs!: number;

  @Column({ name: 'best_ms', type: 'float' })
  bestMs!: number;

  @Column({ name: 'worst_ms', type: 'float' })
  worstMs!: number;

  @Column({ name: 'standard_deviation_ms', type: 'float' })
  standardDeviationMs!: number;
}
