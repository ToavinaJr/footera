import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { GalleriesController } from './galleries.controller.js';
import { GalleriesService } from '../modules/galleries/galleries.service.js';

describe('GalleriesController request contract', () => {
  let app: INestApplication<App>;
  const galleries = {
    add: vi.fn().mockResolvedValue({ images: ['https://example.com/image.jpg'] }),
    get: vi.fn(),
    replace: vi.fn(),
    remove: vi.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [GalleriesController],
      providers: [{ provide: GalleriesService, useValue: galleries }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unexpected properties at the HTTP boundary before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/galleries/players/player-1')
      .send({ imageUrl: 'https://example.com/image.jpg', ownerId: 'attacker' })
      .expect(400);

    expect(galleries.add).not.toHaveBeenCalled();
  });

  it('accepts a valid gallery image payload and delegates to the service', async () => {
    await request(app.getHttpServer())
      .post('/galleries/players/player-1')
      .send({ imageUrl: 'https://example.com/image.jpg' })
      .expect(201)
      .expect(({ body }) => expect(body).toEqual({ images: ['https://example.com/image.jpg'] }));

    expect(galleries.add).toHaveBeenCalledWith('players', 'player-1', 'https://example.com/image.jpg');
  });
});
