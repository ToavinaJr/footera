import { describe, expect, it, vi } from 'vitest';
import { DashboardService, currentTeam } from './dashboard.service.js';
import type { RecordRepository } from '../../database/record.repository.js';
import type { UserContext } from '../auth/user-context.js';

describe('Dashboard privacy and personalization', () => {
  it('uses player membership before ownership and never trusts a free-text CV team', () => {
    const user = { id: 'u', name: 'U', email: 'u@example.com', sportsCv: { currentTeam: 'Fake team' } };
    expect(currentTeam(user, [{ id: 'p', userId: 'u', name: 'U', currentTeamId: 'joined' }], [{ id: 'owned', name: 'Owned', ownerId: 'u' }, { id: 'joined', name: 'Joined' }])?.id).toBe('joined');
    expect(currentTeam(user, [], [])).toBeNull();
  });
  it('returns real favorites, upcoming team match, private activity for the current user only', async () => {
    const rows: Record<string, unknown[]> = {
      players: [{ id: 'p', name: 'Favorite', email: 'private@example.com' }, { id: 'me', userId: 'u', name: 'Me', currentTeamId: 't' }],
      teams: [{ id: 't', name: 'Team', ownerId: 'other' }],
      matches: [
        { id: 'old', status: 'SCHEDULED', scheduledAt: '2000-01-01T10:00:00Z', homeTeam: { id: 't' }, awayTeam: { id: 'x' } },
        { id: 'next', status: 'SCHEDULED', scheduledAt: '2099-01-01T10:00:00Z', homeTeam: { id: 't' }, awayTeam: { id: 'x' } },
      ],
      notifications: [{ id: 'mine', recipientId: 'u', title: 'Private', createdAt: '2026-01-01' }, { id: 'secret', recipientId: 'other', title: 'Secret' }],
      bookings: [{ id: 'secret-booking', userId: 'other' }], applications: [{ id: 'secret-application', userId: 'other' }],
      activity: [{ id: 'public', type: 'match', title: 'Score' }, { id: 'private', type: 'booking', recipientId: 'other' }],
    };
    const records = { find: vi.fn(async () => ({ id: 'u', favoritePlayerIds: ['p'], favoriteTeamIds: ['t'], favoriteMatchIds: ['next'] })), list: vi.fn(async (key: string) => rows[key] ?? []) };
    const result = await new DashboardService(records as unknown as RecordRepository, { userId: 'u' } as UserContext).get();
    expect(result.myTeam?.id).toBe('t');
    expect(result.canManageTeam).toBe(false);
    expect(result.nextTeamMatch?.id).toBe('next');
    expect(result.favoritePlayers.map((item) => item.id)).toEqual(['p']);
    expect(result.favoritePlayers[0]).not.toHaveProperty('email');
    expect(result.personalActivity.map((item) => item.id)).toEqual(['mine']);
    expect(result.platformActivity.map((item) => item.id)).toEqual(['public']);
    expect(result.bookings).toEqual([]);
    expect(result.applications).toEqual([]);
  });
  it('rejects absent authentication before reading collections', async () => {
    const records = { list: vi.fn() };
    await expect(new DashboardService(records as unknown as RecordRepository, {} as UserContext).get()).rejects.toThrow();
    expect(records.list).not.toHaveBeenCalled();
  });
});
