import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from '../modules/uploads/uploads.service.js';
import { AccountsService } from '../modules/accounts/accounts.service.js';

const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/g1sAAAAASUVORK5CYII=', 'base64');

describe('UploadsController security', () => {
  let app: INestApplication;
  let uploadDirectory: string;

  beforeEach(async () => {
    uploadDirectory = await mkdtemp(join(tmpdir(), 'footera-upload-http-'));
    vi.stubEnv('UPLOAD_DIR', uploadDirectory);
    const module = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        UploadsService,
        { provide: AccountsService, useValue: { profile: async () => ({ activeRole: 'Joueur' }) } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    vi.unstubAllEnvs();
    await rm(uploadDirectory, { recursive: true, force: true });
  });

  it('accepts a valid image upload and does not preserve the supplied filename', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads/images')
      .field('purpose', 'avatar')
      .attach('file', onePixelPng, { filename: '../../avatar.png', contentType: 'image/png' })
      .expect(201);
    expect(response.body.filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(response.body.url).toContain(response.body.filename);
  });

  it('rejects SVG and content whose signature does not match its MIME type', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/uploads/images')
      .field('purpose', 'avatar')
      .attach('file', Buffer.from('<svg onload="alert(1)"/>'), { filename: 'avatar.svg', contentType: 'image/svg+xml' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/uploads/images')
      .field('purpose', 'avatar')
      .attach('file', Buffer.from('not an image'), { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .expect(400);
  });

  it('rejects unsupported upload purposes and missing files', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/uploads/images')
      .field('purpose', 'arbitrary-path')
      .attach('file', onePixelPng, { filename: 'safe.png', contentType: 'image/png' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/uploads/images')
      .field('purpose', 'avatar')
      .expect(400);
  });
});
