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
      find: vi.fn(async (collection: string, id: string) => collections[collection]?.find((item) => typeof item === 'object' && item !== null && 'id' in item && item.id === id) ?? null),
    } as unknown as never, {} as unknown as never, { aggregate: vi.fn().mockResolvedValue(new Map()) } as unknown as never, {} as unknown as never);

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
      find: vi.fn(async (collection: string, id: string) => collections[collection]?.find((item) => typeof item === 'object' && item !== null && 'id' in item && item.id === id) ?? null),
    } as unknown as never, {} as unknown as never, { aggregate: vi.fn().mockResolvedValue(new Map()) } as unknown as never, {} as unknown as never);

    const player = await service.getById('player-1');
    expect(player?.age).toBeUndefined();
  });

  it('returns linked contact details only on the individual public profile', async () => {
    const collections: Record<string, unknown[]> = {
      players: [{ id: 'player-1', userId: 'user-1', name: 'Player' }],
      matches: [],
      users: [{ id: 'user-1', name: 'Player', email: 'player@example.com', phone: '+261 34 00 000 00' }],
      tournaments: [],
      teams: [],
    };
    const service = new PlayersService({
      list: vi.fn((collection: string) => Promise.resolve(collections[collection] ?? [])),
      find: vi.fn(async (collection: string, id: string) => collections[collection]?.find((item) => typeof item === 'object' && item !== null && 'id' in item && item.id === id) ?? null),
    } as unknown as never, {} as unknown as never, { aggregate: vi.fn().mockResolvedValue(new Map()) } as unknown as never, {} as unknown as never);

    const directory = await service.list();
    expect(directory[0]).not.toHaveProperty('email');
    expect(directory[0]).not.toHaveProperty('phone');
    await expect(service.getById('player-1')).resolves.toMatchObject({ email: 'player@example.com', phone: '+261 34 00 000 00' });
  });
});
