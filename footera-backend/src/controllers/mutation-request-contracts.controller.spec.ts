import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthController } from './auth.controller.js';
import { ClubsController } from './clubs.controller.js';
import { MarketplaceController } from './marketplace.controller.js';
import { PitchesController } from './pitches.controller.js';
import { PlayersController } from './players.controller.js';
import { AccountsService } from '../modules/accounts/accounts.service.js';
import { ClubsService } from '../modules/clubs/clubs.service.js';
import { BookingsService } from '../modules/bookings/bookings.service.js';
import { SeedService } from '../database/seed.service.js';
import { MarketplaceService } from '../modules/marketplace/marketplace.service.js';
import { PlayersService } from '../modules/players/players.service.js';
import { TeamsService } from '../modules/teams/teams.service.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('mutation controller request contracts', () => {
  let app: INestApplication<App>;
  const accounts = { setActiveRole: vi.fn() };
  const bookings = { ratePitch: vi.fn() };
  const clubs = { updateLogo: vi.fn() };
  const marketplace = { addBrand: vi.fn() };
  const teams = { invitePlayer: vi.fn() };
  const unusedService = {};

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController, ClubsController, MarketplaceController, PitchesController, PlayersController],
      providers: [
        { provide: AccountsService, useValue: accounts },
        { provide: BookingsService, useValue: bookings },
        { provide: ClubsService, useValue: clubs },
        { provide: MarketplaceService, useValue: marketplace },
        { provide: PlayersService, useValue: unusedService },
        { provide: SeedService, useValue: unusedService },
        { provide: TeamsService, useValue: teams },
        { provide: AuthService, useValue: unusedService },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each([
    ['POST', 'pitch rating', '/pitches/pitch-1/reviews', { rating: 5, userId: 'attacker' }, bookings.ratePitch],
    ['PATCH', 'club logo', '/clubs/club-1/logo', { logoUrl: 'https://example.com/logo.png', ownerId: 'attacker' }, clubs.updateLogo],
    ['POST', 'player invitation', '/players/player-1/invite', { message: 'Invitation', teamId: 'attacker' }, teams.invitePlayer],
    ['POST', 'marketplace brand', '/marketplace/brands', { brand: 'Footera', isAdmin: true }, marketplace.addBrand],
    ['POST', 'active role', '/auth/role', { role: 'Entraîneur', userId: 'attacker' }, accounts.setActiveRole],
  ])('rejects unexpected fields on %s %s before service execution', async (method, _name, path, payload, serviceMethod) => {
    await request(app.getHttpServer())[method.toLowerCase() as 'post' | 'patch'](path).send(payload).expect(400);
    expect(serviceMethod).not.toHaveBeenCalled();
  });
});
