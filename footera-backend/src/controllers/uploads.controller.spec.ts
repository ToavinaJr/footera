import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from '../modules/uploads/uploads.service.js';
import { AccountsService } from '../modules/accounts/accounts.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { RecordRepository } from '../database/record.repository.js';

const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/g1sAAAAASUVORK5CYII=', 'base64');

describe('UploadsController security', () => {
  let app: INestApplication;
  const imageRows = new Map<string, { id: string; mimeType: string; content: Uint8Array }>();

  beforeEach(async () => {
    imageRows.clear();
    const prisma = {
      uploadedImageRecord: {
        create: vi.fn(async ({ data }: { data: { id: string; mimeType: string; content: Uint8Array } }) => {
          imageRows.set(data.id, data);
          return data;
        }),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => imageRows.get(where.id) ?? null),
      },
    };
    const module = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        UploadsService,
        { provide: AccountsService, useValue: { profile: async () => ({ activeRole: 'Joueur', roles: ['Joueur'] }) } },
        { provide: PrismaService, useValue: prisma },
        { provide: RecordRepository, useValue: { consumeRateLimit: async () => true } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('accepts an image and generates a persistent URL without preserving the supplied filename', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads/images')
      .field('purpose', 'avatar')
      .attach('file', onePixelPng, { filename: '../../avatar.png', contentType: 'image/png' })
      .expect(201);
    expect(response.body.filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(response.body.url).toContain(response.body.filename);
    expect(imageRows.has(response.body.filename)).toBe(true);
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
