import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';
import { normalizeOriginList } from './utils/text.utils.js';
import { RequestBodyValidationPipe } from './common/pipes/request-body-validation.pipe.js';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  logger.log(JSON.stringify({
    event: 'bootstrap:start',
    nodeEnv: process.env.NODE_ENV || 'undefined',
    vercelEnv: process.env.VERCEL_ENV || 'undefined',
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
  }));
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new RequestBodyValidationPipe());
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
  }
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
  const configuredFrontendOrigins = normalizeOriginList(process.env.FRONTEND_URL, 'http://localhost:3001');
  const frontendOrigins = [...new Set([
    ...configuredFrontendOrigins,
    'https://footera-frontend.vercel.app',
  ])];

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
  logger.log(JSON.stringify({ event: 'bootstrap:listen', port, frontendOrigins: frontendOrigins.length }));
  await app.listen(port, '0.0.0.0');
  logger.log(JSON.stringify({ event: 'bootstrap:ready', port }));
}
await bootstrap().catch((error: unknown) => {
  const details = {
    event: 'bootstrap:failed',
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error),
  };
  logger.error(JSON.stringify(details), error instanceof Error ? error.stack : undefined);
  throw error;
});
