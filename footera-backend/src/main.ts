import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';
import { normalizeOriginList } from './utils/text.utils.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
  }
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
  const frontendOrigins = normalizeOriginList(process.env.FRONTEND_URL, 'http://localhost:3001');

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
