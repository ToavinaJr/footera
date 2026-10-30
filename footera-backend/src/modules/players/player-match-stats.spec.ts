import { describe, expect, it } from 'vitest';
import { aggregatePlayerMatchStats } from './player-match-stats.js';
import { MATCH_EVENT_TYPES, MATCH_STATUSES } from '../../types/domain.js';
import type { MatchRecord, PlayerRecord, TournamentRecord } from '../../types/records.js';

const players: PlayerRecord[] = [
  { id: 'starter', name: 'Starter', currentTeamId: 'home' },
  { id: 'sub-in', name: 'Substitute', currentTeamId: 'home' },
  { id: 'sub-out', name: 'Outgoing', currentTeamId: 'home' },
  { id: 'opponent', name: 'Opponent', currentTeamId: 'away' },
];

const tournament: TournamentRecord = { id: 'cup', title: 'Cup', participantTeamIds: ['home', 'away'] };

function makeMatch(overrides: Partial<MatchRecord> = {}): MatchRecord {
  return {
    id: 'match', tournamentId: 'cup', status: MATCH_STATUSES.FINISHED, minute: 90,
    homeTeam: { id: 'home', score: 1 }, awayTeam: { id: 'away', score: 0 },
    events: [
      { minute: 20, type: MATCH_EVENT_TYPES.GOAL, teamId: 'home', playerId: 'starter', player: 'Starter', assistPlayerId: 'sub-in', assist: 'Substitute' },
      { minute: 35, type: MATCH_EVENT_TYPES.YELLOW_CARD, teamId: 'home', playerId: 'starter', player: 'Starter' },
      { minute: 60, type: MATCH_EVENT_TYPES.SUBSTITUTION, teamId: 'home', playerId: 'sub-in', player: 'Substitute', substitutedPlayerId: 'sub-out' },
    ],
    lineups: [
      { teamId: 'home', playerIds: ['starter', 'sub-out'] },
      { teamId: 'away', playerIds: ['opponent'] },
    ],
    ...overrides,
  };
}

describe('aggregatePlayerMatchStats', () => {
  it('calculates goals, cards, assists, appearances, and minutes from finished match records', () => {
    const stats = aggregatePlayerMatchStats(players, [makeMatch()], {}, [tournament]);
    expect(stats.get('starter')).toMatchObject({ appearances: 1, goals: 1, assists: 0, yellowCards: 1, minutesPlayed: 90 });
    expect(stats.get('sub-in')).toMatchObject({ appearances: 1, goals: 0, assists: 1, minutesPlayed: 30 });
    expect(stats.get('sub-out')).toMatchObject({ appearances: 1, minutesPlayed: 60 });
    expect(stats.get('opponent')).toMatchObject({ appearances: 1, minutesPlayed: 90 });
    expect(stats.get('starter')?.teamStats.get('home')).toMatchObject({ goals: 1, yellowCards: 1, minutesPlayed: 90 });
  });

  it('does not invent minutes when the lineup or played duration is missing', () => {
    const withoutLineups = aggregatePlayerMatchStats(players, [makeMatch({ lineups: undefined })], {}, [tournament]);
    expect(withoutLineups.get('starter')?.minutesPlayed).toBeNull();
    const withoutDuration = aggregatePlayerMatchStats(players, [makeMatch({ minute: undefined })], {}, [tournament]);
    expect(withoutDuration.get('starter')?.minutesPlayed).toBeNull();
  });

  it('stops a sent-off player minutes at the red-card event', () => {
    const match = makeMatch({ events: [
      { minute: 47, type: MATCH_EVENT_TYPES.RED_CARD, teamId: 'home', playerId: 'starter', player: 'Starter' },
    ] });
    const stats = aggregatePlayerMatchStats(players, [match], {}, [tournament]);
    expect(stats.get('starter')).toMatchObject({ redCards: 1, appearances: 1, minutesPlayed: 47 });
  });

  it('filters computed contributions by the selected tournament and team', () => {
    const stats = aggregatePlayerMatchStats(players, [makeMatch()], { competitionId: 'other', teamId: 'home' }, [tournament]);
    expect(stats.size).toBe(0);
  });
});
