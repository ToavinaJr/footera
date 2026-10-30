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
      { list: vi.fn().mockResolvedValue(players) } as unknown as never,
      { list: vi.fn().mockResolvedValue(teams) } as unknown as never,
      { list: vi.fn((collection: string) => Promise.resolve(collection === 'matches' ? matches : [tournament])) } as unknown as never,
      { aggregate: vi.fn().mockResolvedValue(new Map([['player-1', { teamStats: new Map([['team-1', {
        teamId: 'team-1', appearances: 1, goals: 1, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 90,
      }]]) }]])) } as unknown as never,
    );

    await expect(service.topScorers({ tournamentId: 'cup-1' })).resolves.toMatchObject([
      { playerId: 'player-1', teamId: 'team-1', goals: 1, matchesPlayed: 1, tournamentId: 'cup-1' },
    ]);
  });

  it('returns no tournament scorers if no team has registered', async () => {
    const service = new StatsService(
      { list: vi.fn().mockResolvedValue([{ id: 'player-1', name: 'A. Striker' }]) } as unknown as never,
      { list: vi.fn().mockResolvedValue([]) } as unknown as never,
      { list: vi.fn((collection: string) => Promise.resolve(collection === 'matches' ? [] : [{ id: 'cup-1', participantTeamIds: [] }])) } as unknown as never,
      { aggregate: vi.fn().mockResolvedValue(new Map()) } as unknown as never,
    );

    await expect(service.topScorers({ tournamentId: 'cup-1' })).resolves.toEqual([]);
    await expect(service.topAssisters({ tournamentId: 'cup-1' })).resolves.toEqual([]);
  });

  it('filters player goals and cards by current team and competition', async () => {
    const players = [{ id: 'player-1', name: 'A. Striker', currentTeamId: 'team-1', primaryPosition: 'Attaquant', goals: 1, yellowCards: 1 }];
    const listPlayers = vi.fn().mockResolvedValue(players);
    const service = new StatsService(
      { list: listPlayers } as unknown as never,
      { list: vi.fn().mockResolvedValue([{ id: 'team-1', name: 'Team One', logoUrl: '/team.png' }]) } as unknown as never,
      { list: vi.fn().mockResolvedValue([]) } as unknown as never,
      { aggregate: vi.fn().mockResolvedValue(new Map()) } as unknown as never,
    );

    await expect(service.playerStats({ teamId: 'team-1', tournamentId: 'cup-1' })).resolves.toMatchObject([
      { playerId: 'player-1', goals: 1, yellowCards: 1 },
    ]);
    expect(listPlayers).toHaveBeenCalledWith({ competitionId: 'cup-1' });
  });

  it('ranks scorers and assisters with limits and team filters', async () => {
    const players = [{ id: 'player-1', name: 'A. Striker', currentTeamId: 'team-1', primaryPosition: 'Attaquant', avatarUrl: '/p.png' }];
    const teams = [{ id: 'team-1', name: 'Team One', logoUrl: '' }];
    const service = new StatsService(
      { list: vi.fn().mockResolvedValue(players) } as unknown as never,
      { list: vi.fn().mockResolvedValue(teams) } as unknown as never,
      { list: vi.fn().mockResolvedValue([]) } as unknown as never,
      { aggregate: vi.fn().mockResolvedValue(new Map([['player-1', { teamStats: new Map([['team-1', { teamId: 'team-1', goals: 4, assists: 2, penalties: 1, appearances: 2, minutesPlayed: 180 }]]) }]])) } as unknown as never,
    );

    await expect(service.topScorers({ teamId: 'team-1', limit: 1 })).resolves.toMatchObject([{ goals: 4, ratio: 2, minutesPerGoal: 45, rank: 1 }]);
    await expect(service.topAssisters({ teamId: 'team-1', limit: 1 })).resolves.toMatchObject([{ assists: 2, keyPasses: 2, ratio: 1, rank: 1 }]);
    await expect(service.topScorers({ teamId: 'missing' })).resolves.toEqual([]);
  });

  it('returns team statistics and filters player rows', async () => {
    const teams = [{ id: 'team-1', name: 'Team One', competitionId: 'cup-1', logoUrl: '/team.png' }];
    const tournaments = [{ id: 'cup-1', title: 'Cup One', participantTeamIds: ['team-1'] }];
    const matches = [{ id: 'match-1', tournamentId: 'cup-1', status: 'FINISHED', homeTeam: { id: 'team-1', score: 2 }, awayTeam: { id: 'team-2', score: 0 }, events: [] }];
    const player = { id: 'player-1', name: 'A. Striker', currentTeamId: 'team-1', primaryPosition: 'Attaquant', goals: 2 };
    const service = new StatsService(
      { list: vi.fn().mockResolvedValue([player]) } as unknown as never,
      { list: vi.fn().mockResolvedValue(teams) } as unknown as never,
      { list: vi.fn((collection: string) => Promise.resolve(collection === 'matches' ? matches : tournaments)) } as unknown as never,
      { aggregate: vi.fn().mockResolvedValue(new Map()) } as unknown as never,
    );

    await expect(service.teamStats({ tournamentId: 'cup-1' })).resolves.toMatchObject([{ teamId: 'team-1', tournamentId: 'cup-1' }]);
    await expect(service.playerStats({ teamId: 'team-1', position: 'Attaquant', searchQuery: 'striker' })).resolves.toMatchObject([{ playerId: 'player-1' }]);
    await expect(service.playerStats({ searchQuery: 'missing' })).resolves.toEqual([]);
  });
});
