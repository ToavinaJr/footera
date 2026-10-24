import { describe, expect, it, vi } from 'vitest';
import { PlayerMatchStatsService } from './player-match-stats.service.js';
import { MATCH_EVENT_TYPES, MATCH_STATUSES } from '../../types/domain.js';

describe('PlayerMatchStatsService', () => {
  const players = [{ id: 'p1', name: 'Player One', currentTeamId: 't1' }];
  const tournaments = [
    { id: 'cup', title: 'Cup', participantTeamIds: ['t1', 't2'] },
    { id: 'league', title: 'League', participantTeamIds: ['t1', 't2'] },
  ];
  const matches = [
    {
      id: 'cup-match', tournamentId: 'cup', status: MATCH_STATUSES.FINISHED, minute: 90,
      homeTeam: { id: 't1', score: 1 }, awayTeam: { id: 't2', score: 0 },
      lineups: [{ teamId: 't1', playerIds: ['p1'] }],
      events: [{ minute: 20, type: MATCH_EVENT_TYPES.GOAL, teamId: 't1', playerId: 'p1', player: 'Player One' }],
    },
    {
      id: 'league-match', tournamentId: 'league', status: MATCH_STATUSES.FINISHED, minute: 90,
      homeTeam: { id: 't1', score: 0 }, awayTeam: { id: 't2', score: 0 },
      lineups: [{ teamId: 't1', playerIds: ['p1'] }], events: [],
    },
  ];

  function createService() {
    const records = {
      list: vi.fn(async (collection: string) => collection === 'players' ? players : collection === 'matches' ? matches : tournaments),
    };
    return new PlayerMatchStatsService(records as unknown as never);
  }

  it('calculates career totals from every persisted finished match', async () => {
    await expect(createService().career('p1')).resolves.toMatchObject({
      appearances: 2, goals: 1, minutesPlayed: 180, teamStats: [{ teamId: 't1', appearances: 2, goals: 1, minutesPlayed: 180 }],
    });
  });

  it('limits competition totals to matches in that competition', async () => {
    await expect(createService().competition('p1', 'cup')).resolves.toMatchObject({
      appearances: 1, goals: 1, minutesPlayed: 90,
    });
  });

  it('returns null for a missing player', async () => {
    await expect(createService().career('missing')).resolves.toBeNull();
  });
});
