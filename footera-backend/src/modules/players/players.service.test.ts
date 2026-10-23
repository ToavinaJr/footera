import { describe, expect, it, vi } from 'vitest';
import { PlayersService } from './players.service.js';

describe('PlayersService linked profile fields', () => {
  it('uses the linked user birth date and avatar instead of seeded player values', async () => {
    const expectedAge = new Date().getFullYear() - 2000;
    const collections: Record<string, unknown[]> = {
      players: [{ id: 'player-1', userId: 'user-1', age: 18, avatarUrl: '/old.png', name: 'Player' }],
      matches: [],
      users: [{ id: 'user-1', dateOfBirth: '2000-01-01', avatarUrl: '/profile.png' }],
      tournaments: [],
    };
    const service = new PlayersService({
      list: vi.fn((collection: string) => Promise.resolve(collections[collection] ?? [])),
    } as unknown as never, {} as unknown as never);

    await expect(service.getById('player-1')).resolves.toMatchObject({ age: expectedAge, avatarUrl: '/profile.png' });
  });

  it('does not return a seeded age when the linked user has not provided a birth date', async () => {
    const collections: Record<string, unknown[]> = {
      players: [{ id: 'player-1', userId: 'user-1', age: 18, name: 'Player' }],
      matches: [],
      users: [{ id: 'user-1', avatarUrl: '/profile.png' }],
      tournaments: [],
    };
    const service = new PlayersService({
      list: vi.fn((collection: string) => Promise.resolve(collections[collection] ?? [])),
    } as unknown as never, {} as unknown as never);

    const player = await service.getById('player-1');
    expect(player?.age).toBeUndefined();
  });
});
