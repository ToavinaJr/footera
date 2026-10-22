import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MatchesService } from './matches.service.js';

function createService(status: string, favoriteMatchIds: string[] = []) {
  const records = { find: vi.fn().mockResolvedValue({ id: 'match-1', status }) };
  const accounts = {
    profile: vi.fn().mockResolvedValue({ favoriteMatchIds }),
    toggleFavoriteMatch: vi.fn().mockResolvedValue(false),
  };
  return { service: new MatchesService(records as never, accounts as never), accounts };
}

describe('MatchesService.toggleFavorite', () => {
  it('rejects following a finished match', async () => {
    const { service, accounts } = createService('FINISHED');

    await expect(service.toggleFavorite('match-1')).rejects.toBeInstanceOf(ConflictException);
    expect(accounts.toggleFavoriteMatch).not.toHaveBeenCalled();
  });

  it('still allows unfollowing a match that finished after being followed', async () => {
    const { service, accounts } = createService('FINISHED', ['match-1']);

    await expect(service.toggleFavorite('match-1')).resolves.toBe(false);
    expect(accounts.toggleFavoriteMatch).toHaveBeenCalledWith('match-1');
  });

  it('allows following a match that is not finished', async () => {
    const { service, accounts } = createService('SCHEDULED');

    await service.toggleFavorite('match-1');
    expect(accounts.toggleFavoriteMatch).toHaveBeenCalledWith('match-1');
  });

  it('rejects an unknown match', async () => {
    const records = { find: vi.fn().mockResolvedValue(null) };
    const accounts = { profile: vi.fn(), toggleFavoriteMatch: vi.fn() };
    const service = new MatchesService(records as never, accounts as never);

    await expect(service.toggleFavorite('unknown')).rejects.toBeInstanceOf(NotFoundException);
    expect(accounts.profile).not.toHaveBeenCalled();
  });
});
