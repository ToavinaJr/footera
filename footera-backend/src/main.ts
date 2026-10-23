import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: frontendOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const uploadDirectory = resolve(process.env.UPLOAD_DIR || 'uploads');
  app.use('/api/v1/uploads', express.static(uploadDirectory, {
    dotfiles: 'deny',
    index: false,
    setHeaders(response) {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));
  app.setGlobalPrefix('api/v1');
  const port = process.env.NODE_ENV === 'production'
    ? Number(process.env.PORT) || 3000
    : 3000;
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
