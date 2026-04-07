import { setDefaultResultOrder } from 'node:dns';
setDefaultResultOrder('ipv4first');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Serve static files from 'uploads' directory
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
