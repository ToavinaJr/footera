import { describe, expect, it, vi } from 'vitest';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { TournamentsService } from './tournaments.service.js';

describe('TournamentsService registration', () => {
  it('rejects registration once a tournament has started', async () => {
    const records = {
      find: vi.fn().mockResolvedValue({ id: 'cup', status: 'EN_COURS', participantTeamIds: [], maxTeams: 8 }),
      list: vi.fn((collection: string) => Promise.resolve(collection === 'teams' ? [] : [])),
      save: vi.fn(),
    };
    const service = new TournamentsService(records as unknown as never, { add: vi.fn() } as unknown as never, { userId: 'organizer-1' } as unknown as never);

    await expect(service.register('cup', 'team-1')).rejects.toBeInstanceOf(ConflictException);
    expect(records.save).not.toHaveBeenCalled();
  });

  it('rejects registering a team managed by another account', async () => {
    const tournament = { id: 'cup', status: 'INSCRIPTIONS_OUVERTES', startDate: '2026-11-01', participantTeamIds: [], maxTeams: 8 };
    const team = { id: 'team-1', ownerId: 'owner-1', managerIds: [] };
    const records = {
      find: vi.fn(async (collection: string) => collection === 'tournaments' ? tournament : team),
      list: vi.fn(async () => []),
      save: vi.fn(),
    };
    const service = new TournamentsService(records as unknown as never, { add: vi.fn() } as unknown as never, { userId: 'attacker-1' } as unknown as never);

    await expect(service.register('cup', 'team-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(records.save).not.toHaveBeenCalled();
  });

  it('allows a team owner to register their own team', async () => {
    const tournament = { id: 'cup', status: 'INSCRIPTIONS_OUVERTES', startDate: '2026-11-01', participantTeamIds: [], maxTeams: 8 };
    const team = { id: 'team-1', ownerId: 'owner-1', managerIds: [], name: 'FC Test' };
    const records = {
      find: vi.fn(async (collection: string) => collection === 'tournaments' ? tournament : team),
      list: vi.fn(async () => []),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const service = new TournamentsService(records as unknown as never, { add: vi.fn() } as unknown as never, { userId: 'owner-1' } as unknown as never);

    await expect(service.register('cup', 'team-1')).resolves.toBe(true);
    expect(records.save).toHaveBeenCalledWith('tournaments', 'cup', expect.objectContaining({ participantTeamIds: ['team-1'] }));
  });

  it('binds a newly created tournament to the authenticated organizer', async () => {
    const records = {
      create: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const notifications = { add: vi.fn(async () => undefined) };
    const service = new TournamentsService(records as unknown as never, notifications as unknown as never, { userId: 'organizer-1' } as unknown as never);

    const created = await service.create({
      title: 'Coupe test', format: '7v7', city: 'Antananarivo', venue: 'Terrain central',
      startDate: '2026-11-01', endDate: '2026-11-02', maxTeams: 8, entryFee: 0, prizePool: 0,
      bannerUrl: '', organizer: 'Organisateur affiché',
    });

    expect(records.create).toHaveBeenCalledWith('tournaments', created.id, expect.objectContaining({ organizerId: 'organizer-1' }));
  });
});
