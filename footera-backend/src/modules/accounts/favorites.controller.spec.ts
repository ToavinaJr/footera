import { describe, expect, it, vi } from 'vitest';
import { FavoritesController } from './favorites.controller.js';
import type { RecordRepository } from '../../database/record.repository.js';
import type { UserContext } from '../auth/user-context.js';

describe('Persistent favorites', () => {
  it('scopes mutations to the authenticated user and supports idempotent removal', async () => {
    const records = { find: vi.fn(async () => null), setUserFavorite: vi.fn() };
    const controller = new FavoritesController(records as unknown as RecordRepository, { userId: 'me' } as UserContext);
    await controller.set('players', 'deleted', { favorite: false });
    expect(records.setUserFavorite).toHaveBeenCalledWith('me', 'favoritePlayerIds', 'deleted', false);
    await expect(controller.set('players', 'deleted', { favorite: true })).rejects.toThrow();
    await expect(controller.set('users', 'victim', { favorite: true })).rejects.toThrow();
    await expect(controller.set('teams', 't', { favorite: 'true' })).rejects.toThrow();
    await expect(controller.set('teams', 't', { favorite: true, ownerId: 'attacker' })).rejects.toThrow();
  });
  it('preserves the finished-match following restriction', async () => {
    const records = { find: vi.fn(async (collection: string) => collection === 'matches' ? { status: 'FINISHED' } : { favoriteMatchIds: [] }), setUserFavorite: vi.fn() };
    const controller = new FavoritesController(records as unknown as RecordRepository, { userId: 'me' } as UserContext);
    await expect(controller.set('matches', 'm', { favorite: true })).rejects.toThrow();
    expect(records.setUserFavorite).not.toHaveBeenCalled();
  });
});
