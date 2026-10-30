import type { Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.factory.js';

type ExpressHandler = (request: Request, response: Response) => unknown;

let handlerPromise: Promise<ExpressHandler> | undefined;

async function getHandler(): Promise<ExpressHandler> {
  if (!handlerPromise) {
    handlerPromise = NestFactory.create(AppModule)
      .then((app) => configureApp(app))
      .then((app) => app.getHttpAdapter().getInstance() as ExpressHandler);
  }
  return handlerPromise;
}

export default async function handler(request: Request, response: Response) {
  const expressHandler = await getHandler();
  return expressHandler(request, response);
}
