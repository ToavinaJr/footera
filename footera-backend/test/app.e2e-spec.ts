import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { createApp } from '../src/app.factory.js';

describe.skipIf(process.env.CI !== 'true')('Footera API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must point to the isolated CI database for E2E tests.');
    }
    app = await createApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves the public API status route through the real application', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/status')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          name: 'Footera API',
          status: 'operational',
        });
      });
  });

  it('applies the global authentication guard to protected API routes', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });
});
