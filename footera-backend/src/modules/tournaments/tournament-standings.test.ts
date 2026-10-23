import { describe, expect, it } from 'vitest';
import { buildTournamentStandings } from './tournament-standings.js';

describe('buildTournamentStandings', () => {
  it('calculates 3/1/0 points and ignores other competitions and unfinished matches', () => {
    const tournament = { id: 'league', participantTeamIds: ['home', 'away', 'idle'] };
    const teams = ['home', 'away', 'idle'].map((id) => ({ id, name: id }));
    const matches = [
      { id: 'win', tournamentId: 'league', status: 'FINISHED', homeTeam: { id: 'home', score: 2 }, awayTeam: { id: 'away', score: 1 } },
      { id: 'draw', tournamentId: 'league', status: 'FINISHED', homeTeam: { id: 'away', score: 0 }, awayTeam: { id: 'idle', score: 0 } },
      { id: 'pending', tournamentId: 'league', status: 'SCHEDULED', homeTeam: { id: 'idle', score: 9 }, awayTeam: { id: 'home', score: 0 } },
      { id: 'wrong-league', tournamentId: 'cup', status: 'FINISHED', homeTeam: { id: 'idle', score: 8 }, awayTeam: { id: 'home', score: 0 } },
    ];

    expect(buildTournamentStandings(tournament, teams, matches)).toMatchObject([
      { teamId: 'home', played: 1, won: 1, points: 3, goalsFor: 2, goalsAgainst: 1 },
      { teamId: 'idle', played: 1, drawn: 1, points: 1 },
      { teamId: 'away', played: 2, won: 0, drawn: 1, lost: 1, points: 1 },
    ]);
  });
});
