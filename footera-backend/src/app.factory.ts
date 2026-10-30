import 'dotenv/config';
import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';
import { getFrontendOrigins } from './utils/text.utils.js';
import { RequestBodyValidationPipe } from './common/pipes/request-body-validation.pipe.js';

const logger = new Logger('Bootstrap');

export async function configureApp(app: INestApplication) {
  app.useGlobalPipes(new RequestBodyValidationPipe());
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
  }
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
  const frontendOrigins = getFrontendOrigins(process.env.FRONTEND_URL);

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
  await app.init();
  logger.log(JSON.stringify({ event: 'bootstrap:ready', mode: process.env.VERCEL ? 'vercel' : 'server' }));
  return app;
}

export async function createApp() {
  logger.log(JSON.stringify({
    event: 'bootstrap:start',
    nodeEnv: process.env.NODE_ENV || 'undefined',
    vercelEnv: process.env.VERCEL_ENV || 'undefined',
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
  }));
  return configureApp(await NestFactory.create(AppModule));
}
