import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MatchesService } from './matches.service.js';

function createService(status: string, favoriteMatchIds: string[] = []) {
  const records = { find: vi.fn().mockResolvedValue({ id: 'match-1', status }) };
  const accounts = {
    profile: vi.fn().mockResolvedValue({ favoriteMatchIds }),
    toggleFavoriteMatch: vi.fn().mockResolvedValue(false),
  };
  return { service: new MatchesService(records as never, accounts as never, { userId: 'organizer-1' } as never), accounts };
}

describe('MatchesService.toggleFavorite', () => {
  it('rejects following a finished match', async () => {
    const { service, accounts } = createService('FINISHED');

    await expect(service.toggleFavorite('match-1')).rejects.toBeInstanceOf(ConflictException);
    expect(accounts.toggleFavoriteMatch).not.toHaveBeenCalled();
  });

  it('still allows unfollowing a match that finished after being followed', async () => {
    const { service, accounts } = createService('FINISHED', ['match-1']);

    await expect(service.toggleFavorite('match-1')).resolves.toBe(false);
    expect(accounts.toggleFavoriteMatch).toHaveBeenCalledWith('match-1');
  });

  it('allows following a match that is not finished', async () => {
    const { service, accounts } = createService('SCHEDULED');

    await service.toggleFavorite('match-1');
    expect(accounts.toggleFavoriteMatch).toHaveBeenCalledWith('match-1');
  });

  it('rejects an unknown match', async () => {
    const records = { find: vi.fn().mockResolvedValue(null) };
    const accounts = { profile: vi.fn(), toggleFavoriteMatch: vi.fn() };
    const service = new MatchesService(records as never, accounts as never, { userId: 'organizer-1' } as never);

    await expect(service.toggleFavorite('unknown')).rejects.toBeInstanceOf(NotFoundException);
    expect(accounts.profile).not.toHaveBeenCalled();
  });
});

describe('MatchesService event player profiles', () => {
  it('creates and persists player IDs for legacy match events', async () => {
    const match = {
      id: 'match-legacy', status: 'FINISHED',
      homeTeam: { id: 'team-1', name: 'Team One', score: 1 },
      awayTeam: { id: 'team-2', name: 'Team Two', score: 0 },
      events: [{ minute: 12, type: 'goal', teamId: 'team-1', player: 'Buteur Test', assist: 'Passeur Test' }],
    };
    const savedPlayers: Array<{ id: string; name: string }> = [];
    const savedMatches: unknown[] = [];
    const records = {
      list: vi.fn(async (collection: string) => collection === 'matches' ? [match]
        : collection === 'teams' ? [{ id: 'team-1', name: 'Team One', city: 'Antananarivo', members: [] }]
          : []),
      find: vi.fn(async () => null),
      save: vi.fn(async (collection: string, _id: string, payload: unknown) => {
        if (collection === 'players') savedPlayers.push(payload as { id: string; name: string });
        if (collection === 'matches') savedMatches.push(payload);
        return payload;
      }),
    };
    const service = new MatchesService(records as never, {} as never, { userId: 'organizer-1' } as never);

    const [result] = await service.list();

    expect(result.events?.[0]).toMatchObject({
      player: 'Buteur Test',
      playerId: expect.stringMatching(/^match_player_[a-f0-9]{24}$/),
      assist: 'Passeur Test',
      assistPlayerId: expect.stringMatching(/^match_player_[a-f0-9]{24}$/),
    });
    expect(savedPlayers).toHaveLength(2);
    expect(savedMatches).toHaveLength(1);
  });
});

describe('MatchesService tournament organizer controls', () => {
  const pendingMatch = {
    id: 'match-pending', tournamentId: 'cup-1', status: 'SCHEDULED', minute: 0,
    homeTeam: { id: 'team-1', name: 'Home', score: 0 },
    awayTeam: { id: 'team-2', name: 'Away', score: 0 },
    events: [],
  };

  function managementService(userId: string) {
    const records = {
      find: vi.fn(async (collection: string) => collection === 'matches'
        ? pendingMatch : { id: 'cup-1', organizerId: 'organizer-1' }),
      list: vi.fn(async () => []),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const service = new MatchesService(records as never, {} as never, { userId } as never);
    return { service, records };
  }

  it('lets the tournament organizer launch a scheduled match', async () => {
    const { service, records } = managementService('organizer-1');

    await expect(service.start('match-pending')).resolves.toMatchObject({ status: 'LIVE', minute: 0 });
    expect(records.save).toHaveBeenCalledWith('matches', 'match-pending', expect.objectContaining({ status: 'LIVE' }));
  });

  it('rejects match management by a non-organizer', async () => {
    const { service, records } = managementService('another-user');

    await expect(service.start('match-pending')).rejects.toBeInstanceOf(ForbiddenException);
    expect(records.save).not.toHaveBeenCalled();
  });

  it('does not allow changes after the match has finished', async () => {
    const { service, records } = managementService('organizer-1');
    records.find.mockResolvedValueOnce({ ...pendingMatch, status: 'FINISHED' });

    await expect(service.update('match-pending', { venue: 'Nouveau stade' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('finishes a live match and publishes the final score', async () => {
    const { service, records } = managementService('organizer-1');
    records.find.mockResolvedValueOnce({ ...pendingMatch, status: 'LIVE', minute: 45 });

    await expect(service.finish('match-pending')).resolves.toMatchObject({ status: 'FINISHED', minute: 90 });
    expect(records.save).toHaveBeenCalledWith('matches', 'match-pending', expect.objectContaining({ status: 'FINISHED', minute: 90 }));
  });

  it('rejects invalid match updates before persistence', async () => {
    const { service, records } = managementService('organizer-1');

    await expect(service.update('match-pending', {})).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update('match-pending', { venue: '' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update('match-pending', { scheduledAt: 'not-a-date' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update('match-pending', {
      events: [{ minute: 1, type: 'goal', teamId: 'team-1', playerId: 'player-1', adminOverride: true }],
    })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update('match-pending', {
      lineups: [{ teamId: 'team-1', playerIds: [], captainId: 'player-1' }],
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(records.save).not.toHaveBeenCalled();
  });

  it('validates events and lineups, recalculates scores, and publishes the update', async () => {
    const players = [
      { id: 'player-home', name: 'Buteur', currentTeamId: 'team-1' },
      { id: 'player-assist', name: 'Passeur', currentTeamId: 'team-1' },
      { id: 'player-away', name: 'Défenseur', currentTeamId: 'team-2' },
      { id: 'player-sub', name: 'Remplaçant', currentTeamId: 'team-2' },
    ];
    const teams = [{ id: 'team-1', name: 'Home', members: [] }, { id: 'team-2', name: 'Away', members: [] }];
    const records = {
      find: vi.fn(async (collection: string) => collection === 'matches' ? pendingMatch : { id: 'cup-1', organizerId: 'organizer-1' }),
      list: vi.fn(async (collection: string) => collection === 'players' ? players : teams),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
      publishActivity: vi.fn(),
    };
    const service = new MatchesService(records as never, {} as never, { userId: 'organizer-1' } as never);

    const result = await service.update('match-pending', {
      date: '2026-10-30', time: '18:30',
      events: [
        { minute: 12, type: 'goal', teamId: 'team-1', playerId: 'player-home', assistPlayerId: 'player-assist', description: '<b>But</b>' },
        { minute: 30, type: 'sub', teamId: 'team-2', playerId: 'player-away', substitutedPlayerId: 'player-sub' },
      ],
      lineups: [
        { teamId: 'team-1', playerIds: ['player-home', 'player-assist'] },
        { teamId: 'team-2', playerIds: ['player-away', 'player-sub'] },
      ],
    });

    expect(result).toMatchObject({ homeTeam: { score: 1 }, awayTeam: { score: 0 }, scheduledAt: '2026-10-30T18:30:00.000Z' });
    expect(result.events?.[0]).toMatchObject({ player: 'Buteur', assist: 'Passeur', description: '<b>But</b>' });
    expect(records.publishActivity).toHaveBeenCalledOnce();
  });

  it('rejects invalid event and lineup references', async () => {
    const records = {
      find: vi.fn(async (collection: string) => collection === 'matches' ? pendingMatch : { id: 'cup-1', organizerId: 'organizer-1' }),
      list: vi.fn(async () => []),
      save: vi.fn(),
    };
    const service = new MatchesService(records as never, {} as never, { userId: 'organizer-1' } as never);
    await expect(service.update('match-pending', { events: [{ minute: 200, type: 'goal', teamId: 'team-1', playerId: 'missing' }] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update('match-pending', { lineups: [{ teamId: 'team-1', playerIds: ['missing'] }] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns standings, manageable matches, filtered lists, and activity feed', async () => {
    const tournament = { id: 'cup-1', title: 'Coupe', participantTeamIds: ['team-1', 'team-2'] };
    const matches = [{ ...pendingMatch, status: 'FINISHED', homeTeam: { ...pendingMatch.homeTeam, score: 2 }, awayTeam: { ...pendingMatch.awayTeam, score: 0 } }];
    const records = {
      list: vi.fn(async (collection: string) => collection === 'tournaments' ? [tournament] : collection === 'teams' ? [pendingMatch.homeTeam, pendingMatch.awayTeam] : collection === 'matches' ? matches : collection === 'activity' ? [{ id: 'activity-1' }] : []),
      find: vi.fn(async () => null),
    };
    const service = new MatchesService(records as never, {} as never, { userId: 'organizer-1' } as never);
    await expect(service.standings('cup-1')).resolves.toHaveLength(2);
    await expect(service.activityFeed()).resolves.toEqual([{ id: 'activity-1' }]);
    await expect(service.list('FINISHED')).resolves.toHaveLength(1);
    await expect(service.manageableMatchIds()).resolves.toEqual([]);
  });
});
