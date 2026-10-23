import { describe, expect, it, vi } from 'vitest';
import type { RecordRepository } from '../../database/record.repository.js';
import type { CatalogsService } from '../catalogs/catalogs.service.js';
import { UserContext } from '../auth/user-context.js';
import { calculateAge } from './calculate-age.js';
import { AccountsService } from './accounts.service.js';

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
