import { Module, Global } from '@nestjs/common';
import { AppLogger } from './app-logger.service.js';

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
