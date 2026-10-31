import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from '../modules/teams/teams.service.js';

describe('TeamsController request contract', () => {
  let app: INestApplication<App>;
  const teams = {
    requestJoin: vi.fn().mockResolvedValue({ success: true }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [{ provide: TeamsService, useValue: teams }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects extra join fields before the service can process a request', async () => {
    await request(app.getHttpServer())
      .post('/teams/team-1/join')
      .send({ message: 'Je souhaite rejoindre votre équipe.', position: 'Avant-centre', ownerId: 'attacker' })
      .expect(400);

    expect(teams.requestJoin).not.toHaveBeenCalled();
  });

  it('forwards the validated join fields to the service', async () => {
    await request(app.getHttpServer())
      .post('/teams/team-1/join')
      .send({ message: 'Je souhaite rejoindre votre équipe.', position: 'Avant-centre' })
      .expect(201);

    expect(teams.requestJoin).toHaveBeenCalledWith('team-1', 'Je souhaite rejoindre votre équipe.', 'Avant-centre');
  });
});
