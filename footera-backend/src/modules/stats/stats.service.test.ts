import { describe, expect, it, vi } from 'vitest';
import { StatsService } from './stats.service.js';

describe('StatsService tournament leaderboards', () => {
  it('only counts scorers from finished matches in the selected tournament and registered teams', async () => {
    const players = [{ id: 'player-1', name: 'A. Striker', currentTeamId: 'team-1', primaryPosition: 'Attaquant', goals: 12, appearances: 10 }];
    const teams = [{ id: 'team-1', name: 'Team One', logoUrl: '/team.png' }, { id: 'team-2', name: 'Team Two', logoUrl: '/team2.png' }];
    const tournament = { id: 'cup-1', title: 'Cup One', participantTeamIds: ['team-1', 'team-2'] };
    const matches = [
      { id: 'valid', tournamentId: 'cup-1', status: 'FINISHED', homeTeam: { id: 'team-1' }, awayTeam: { id: 'team-2' }, events: [{ type: 'goal', teamId: 'team-1', playerId: 'player-1', player: 'A. Striker' }] },
      { id: 'other-cup', tournamentId: 'cup-2', status: 'FINISHED', homeTeam: { id: 'team-1' }, awayTeam: { id: 'team-2' }, events: [{ type: 'goal', teamId: 'team-1', playerId: 'player-1', player: 'A. Striker' }] },
      { id: 'unregistered-team', tournamentId: 'cup-1', status: 'FINISHED', homeTeam: { id: 'team-1' }, awayTeam: { id: 'team-3' }, events: [{ type: 'goal', teamId: 'team-1', playerId: 'player-1', player: 'A. Striker' }] },
    ];
    const service = new StatsService(
      { list: vi.fn().mockResolvedValue(players) } as any,
      { list: vi.fn().mockResolvedValue(teams) } as any,
      { getById: vi.fn().mockResolvedValue(tournament) } as any,
      { list: vi.fn().mockResolvedValue(matches) } as any,
    );

    await expect(service.topScorers({ tournamentId: 'cup-1' })).resolves.toMatchObject([
      { playerId: 'player-1', teamId: 'team-1', goals: 1, matchesPlayed: 1, tournamentId: 'cup-1' },
    ]);
  });

  it('returns no tournament scorers if no team has registered', async () => {
    const service = new StatsService(
      { list: vi.fn().mockResolvedValue([{ id: 'player-1', name: 'A. Striker' }]) } as any,
      { list: vi.fn().mockResolvedValue([]) } as any,
      { getById: vi.fn().mockResolvedValue({ id: 'cup-1', participantTeamIds: [] }) } as any,
      { list: vi.fn().mockResolvedValue([]) } as any,
    );

    await expect(service.topScorers({ tournamentId: 'cup-1' })).resolves.toEqual([]);
    await expect(service.topAssisters({ tournamentId: 'cup-1' })).resolves.toEqual([]);
  });
});
