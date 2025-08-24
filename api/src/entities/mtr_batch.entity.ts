
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Relation } from 'typeorm';
import { MtrResult } from './mtr_result.entity.js';
import { Index } from 'typeorm';

@Entity('mtr_batch')
@Index('idx_mtr_batch_created_at', ['createdAt'])
export class MtrBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'source_name', type: 'varchar' })
  sourceName!: string;

  @Column({ name: 'destination_name', type: 'varchar' })
  destinationName!: string;

  @Column({ name: 'test_count', type: 'int' })
  testCount!: number;

  @Column({ name: 'packet_size', type: 'int' })
  packetSize!: number;

  @OneToMany(() => MtrResult, (result) => result.batch, { cascade: true })
  results!: Relation<MtrResult[]>;
}
