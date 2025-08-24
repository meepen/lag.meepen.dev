import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module.js';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from './common/logger/app-logger.service.js';

const app = await NestFactory.create(AppModule);

const configService = app.get(ConfigService);
const logger = await app.resolve(AppLogger);

const frontendOrigin = configService.getOrThrow<string>('FRONTEND_URL');
// Configure CORS
app.enableCors({
  origin: frontendOrigin.split(',').map((url) => url.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
});

logger.debug(`CORS enabled for origin: ${frontendOrigin}`);

app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
);

logger.log('Application starting on port 3000');
await app.listen(3000);
logger.log('Application successfully started on port 3000');
