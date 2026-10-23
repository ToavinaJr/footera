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
    const service = new TournamentsService(records as any, { add: vi.fn() } as any);

    await expect(service.register('cup', 'team-1')).rejects.toBeInstanceOf(ConflictException);
    expect(records.save).not.toHaveBeenCalled();
  });
});
