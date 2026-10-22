import { describe, expect, it } from 'vitest';
import { buildTeamMatchSummary } from './team-match-summary.js';

const matches = [
  {
    id: 'older-win', status: 'FINISHED', playedAt: '2026-10-10T15:00:00Z',
    homeTeam: { id: 'team-a', score: 2 }, awayTeam: { id: 'team-b', score: 0 },
    events: [{ type: 'goal', minute: 12, teamId: 'team-a', player: 'Alex' }],
  },
  {
    id: 'newer-loss', status: 'FINISHED', playedAt: '2026-10-12T15:00:00Z',
    homeTeam: { id: 'team-c', score: 3 }, awayTeam: { id: 'team-a', score: 1 },
    events: [{ type: 'goal', minute: 45, teamId: 'team-c', player: 'Sam' }],
  },
  {
    id: 'upcoming', status: 'SCHEDULED', scheduledAt: '2026-10-20T15:00:00Z',
    homeTeam: { id: 'team-a', score: 0 }, awayTeam: { id: 'team-c', score: 0 },
    events: [],
  },
];

describe('buildTeamMatchSummary', () => {
  it('orders results by date and calculates form from the team perspective', () => {
    const summary = buildTeamMatchSummary('team-a', matches);

    expect(summary.recentMatches.map((match) => match.id)).toEqual(['newer-loss', 'older-win']);
    expect(summary.recentForm).toEqual(['D', 'V']);
  });

  it('returns upcoming matches and only goal events with home/away context', () => {
    const summary = buildTeamMatchSummary('team-a', matches);

    expect(summary.upcomingMatches).toHaveLength(1);
    expect(summary.upcomingMatches[0]).toMatchObject({ id: 'upcoming', isHome: true, goalScorers: [] });
    expect(summary.recentMatches[0].goalScorers).toHaveLength(1);
  });
});
