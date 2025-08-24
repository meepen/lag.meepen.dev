import { HealthModule } from './health/health.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MtrBatch } from '../entities/mtr_batch.entity.js';
import { MtrResult } from '../entities/mtr_result.entity.js';
import { DataloaderModule } from './dataloader/dataloader.module.js';
import { LagModule } from './lag/lag.module.js';
import { LoggerModule } from '../common/logger/logger.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || process.env.PGHOST || 'db',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'user',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'mydb',
      entities: [MtrBatch, MtrResult],
      synchronize: true,
    }),
    DataloaderModule,
    HealthModule,
    LagModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
