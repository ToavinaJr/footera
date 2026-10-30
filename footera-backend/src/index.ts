import type { Request, Response } from 'express';
import { createApp } from './app.factory.js';

type ExpressHandler = (request: Request, response: Response) => unknown;

let handlerPromise: Promise<ExpressHandler> | undefined;

async function getHandler(): Promise<ExpressHandler> {
  if (!handlerPromise) {
    handlerPromise = createApp().then((app) => app.getHttpAdapter().getInstance() as ExpressHandler);
  }
  return handlerPromise;
}

export default async function handler(request: Request, response: Response) {
  const expressHandler = await getHandler();
  return expressHandler(request, response);
}
