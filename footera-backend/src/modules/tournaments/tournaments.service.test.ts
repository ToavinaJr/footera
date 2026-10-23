import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
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
