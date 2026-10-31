import { describe, expect, it, vi } from 'vitest';
import type { RecordRepository } from '../../database/record.repository.js';
import type { CatalogsService } from '../catalogs/catalogs.service.js';
import { UserContext } from '../auth/user-context.js';
import { calculateAge } from './calculate-age.js';
import { AccountsService } from './accounts.service.js';

function createAccountService() {
  const user = {
    id: 'user-1', name: 'Player One', email: 'player@example.com', passwordHash: 'secret', phone: '', city: 'Tana',
    avatarUrl: '', dateOfBirth: '1990-01-15', roles: ['Joueur', 'Entraîneur'], activeRole: 'Joueur',
    favoriteTeamIds: ['team-1'], favoriteMatchIds: [], sportsCv: { primaryPosition: 'Milieu' },
  };
  const records = {
    find: vi.fn(async () => user),
    list: vi.fn(async () => []),
    save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    updateUserPreferences: vi.fn(async () => undefined),
  };
  const catalogs = { values: vi.fn(async (key: string) => key === 'playerPositions' ? ['Milieu', 'Gardien'] : ['Droit', 'Gauche']) };
  const context = new UserContext();
  const service = new AccountsService(records as unknown as RecordRepository, catalogs as unknown as CatalogsService, context);
  return { service, records, catalogs, context, user };
}

describe('AccountsService date of birth updates', () => {
  it('persists the birth date and recalculates age for the account and linked player', async () => {
    const user = { id: 'user-1', name: 'Player One', email: 'player@example.com', dateOfBirth: '' };
    const player = { id: 'player-1', userId: 'user-1', name: 'Player One', age: 0 };
    const records = {
      find: vi.fn(async () => user),
      list: vi.fn(async () => [player]),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const context = new UserContext();
    const service = new AccountsService(
      records as unknown as RecordRepository,
      {} as unknown as CatalogsService,
      context,
    );
    const dateOfBirth = '1990-01-15';

    const updated = await context.run('user-1', () => service.updateProfile({ dateOfBirth }));

    expect(records.save).toHaveBeenNthCalledWith(1, 'users', 'user-1', expect.objectContaining({ dateOfBirth }));
    expect(records.save).toHaveBeenNthCalledWith(2, 'players', 'player-1', expect.objectContaining({ age: calculateAge(dateOfBirth) }));
    expect(updated).toMatchObject({ dateOfBirth, age: calculateAge(dateOfBirth) });
  });
});

describe('AccountsService account operations', () => {
  it('returns a profile without the password hash', async () => {
    const { service, context } = createAccountService();
    await expect(context.run('user-1', () => service.profile())).resolves.toMatchObject({ id: 'user-1', age: 36 });
  });

  it('updates a valid profile and linked player fields', async () => {
    const { service, records, context } = createAccountService();
    records.list.mockResolvedValue([{ id: 'player-1', userId: 'user-1', name: 'Old Name', age: 1 }]);

    const result = await context.run('user-1', () => service.updateProfile({ name: 'New Name', phone: '+261 341234567', city: 'Fianarantsoa', avatarUrl: '/api/v1/uploads/8c82b450-a0fa-4fe1-a431-e8f98d483caa.webp' }));

    expect(result).toMatchObject({ name: 'New Name', city: 'Fianarantsoa' });
    expect(records.save).toHaveBeenCalledWith('players', 'player-1', expect.objectContaining({ name: 'New Name' }));
  });

  it('rejects invalid profile payloads', async () => {
    const { service, context } = createAccountService();
    await expect(context.run('user-1', () => service.updateProfile({ unknown: 'field' }))).rejects.toThrow();
    await expect(context.run('user-1', () => service.updateProfile({ phone: 'invalid' }))).rejects.toThrow();
    await expect(context.run('user-1', () => service.updateProfile({ dateOfBirth: '2099-01-01' }))).rejects.toThrow();
  });

  it('updates the sports CV and active role', async () => {
    const { service, records, context } = createAccountService();
    await expect(context.run('user-1', () => service.updateSportsCv({ primaryPosition: 'Gardien', strongFoot: 'Droit' }))).resolves.toMatchObject({ id: 'user-1' });
    await expect(context.run('user-1', () => service.setActiveRole('Entraîneur'))).resolves.toMatchObject({ activeRole: 'Entraîneur' });
    expect(records.save).toHaveBeenCalled();
    await expect(context.run('user-1', () => service.setActiveRole('Administrateur'))).rejects.toThrow();
  });

  it('validates preferences and toggles favorites', async () => {
    const { service, records, context } = createAccountService();
    await expect(context.run('user-1', () => service.updatePreferences({ language: 'en', showPersonalActivity: true }))).resolves.toMatchObject({ id: 'user-1' });
    await expect(context.run('user-1', () => service.updatePreferences({ language: 'xx' }))).rejects.toThrow();
    await expect(context.run('user-1', () => service.updatePreferences({ language: 'en', ownerId: 'attacker' }))).rejects.toThrow();
    await expect(context.run('user-1', () => service.toggleFavoriteTeam('team-1'))).resolves.toBe(false);
    await expect(context.run('user-1', () => service.toggleFavoriteMatch('match-1'))).resolves.toBe(true);
    expect(records.updateUserPreferences).toHaveBeenCalledWith('user-1', { language: 'en', showPersonalActivity: true });
  });
});
