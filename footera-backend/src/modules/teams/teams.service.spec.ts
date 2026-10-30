import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TeamsService } from './teams.service.js';

function makeService(existingInvitations: unknown[] = []) {
  const team = { id: 'team-1', ownerId: 'usr_me', name: 'FC Test', city: 'Antananarivo', members: [] };
  const player = { id: 'player-1', name: 'Joueur Test' };
  const user = { id: 'usr_me', name: 'Responsable', roles: ['Entraîneur'] };
  const records = {
    list: vi.fn(async (collection: string) => collection === 'teams' ? [team] : collection === 'matches' ? [] : existingInvitations),
    find: vi.fn(async (collection: string) => collection === 'players' ? player : user),
    create: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
  };
  const accounts = { profile: vi.fn(async () => user) };
  const notifications = { add: vi.fn(async (payload: unknown) => payload) };
  return { service: new TeamsService(records as unknown as never, accounts as unknown as never, notifications as unknown as never, { values: vi.fn(async () => ['Avant-centre']) } as unknown as never), records, notifications };
}

describe('TeamsService player invitations', () => {
  it('persists a pending invitation and notifies its player recipient', async () => {
    const { service, records, notifications } = makeService();

    const result = await service.invitePlayer('player-1', 'Venez faire un essai.');

    expect(result.invitation.status).toBe('PENDING');
    expect(records.create).toHaveBeenCalledWith('teamInvitations', result.invitation.id, result.invitation);
    expect(notifications.add).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: 'player-1',
      invitationId: result.invitation.id,
      invitationStatus: 'PENDING',
    }));
  });

  it('rejects a duplicate pending invitation for the same team and player', async () => {
    const existing = {
      teamId: 'team-1', playerId: 'player-1', status: 'PENDING',
    };
    const { service, records } = makeService([existing]);

    await expect(service.invitePlayer('player-1', 'Venez faire un essai.')).rejects.toBeInstanceOf(ConflictException);
    expect(records.create).not.toHaveBeenCalled();
  });
});

describe('TeamsService join requests', () => {
  it('stores a pending request and does not add the player to the roster', async () => {
    const team = { id: 'team-1', ownerId: 'owner-1', name: 'FC Test', members: [] };
    const player = { id: 'player-1', userId: 'usr_player', name: 'Joueur Test' };
    const user = { id: 'usr_player', name: 'Joueur Test', roles: ['Joueur'] };
    const records = {
      find: vi.fn(async () => team),
      list: vi.fn(async (collection: string) => collection === 'players' ? [player] : []),
      create: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const notifications = { add: vi.fn(async (payload: unknown) => payload) };
    const service = new TeamsService(records as unknown as never, { profile: vi.fn(async () => user) } as unknown as never, notifications as unknown as never, { values: vi.fn(async () => ['Avant-centre']) } as unknown as never);

    const result = await service.requestJoin('team-1', 'Disponible les week-ends.', 'Avant-centre');

    expect(result).toMatchObject({ success: true, status: 'PENDING' });
    expect(records.create).toHaveBeenCalledWith('teamJoinRequests', expect.any(String), expect.objectContaining({
      teamId: 'team-1', playerId: 'player-1', userId: 'usr_player', position: 'Avant-centre', status: 'PENDING',
    }));
    expect(records.save).not.toHaveBeenCalledWith('teams', expect.anything(), expect.anything());
    expect(notifications.add).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'owner-1' }));
  });
});

describe('TeamsService public roster statistics', () => {
  it('returns per-competition goal and assist totals for the team roster', async () => {
    const team = { id: 'team-1', name: 'FC Test', competitionId: 'cup-1', members: [
      { playerId: 'player-1', name: 'Buteur', position: 'Avant-centre' },
      { playerId: 'player-2', name: 'Passeur', position: 'Milieu' },
    ] };
    const opponent = { id: 'team-2', name: 'FC Adverse', participantTeamIds: ['team-1', 'team-2'] };
    const tournament = { id: 'cup-1', title: 'Coupe Test', participantTeamIds: ['team-1', 'team-2'] };
    const players = [
      { id: 'player-1', name: 'Buteur', currentTeamId: 'team-1' },
      { id: 'player-2', name: 'Passeur', currentTeamId: 'team-1' },
    ];
    const match = {
      id: 'match-1', tournamentId: 'cup-1', status: 'FINISHED',
      homeTeam: { id: 'team-1', name: 'FC Test', score: 1 },
      awayTeam: { id: 'team-2', name: 'FC Adverse', score: 0 },
      events: [{ type: 'goal', teamId: 'team-1', playerId: 'player-1', player: 'Buteur', assistPlayerId: 'player-2', assist: 'Passeur', minute: 20 }],
    };
    const records = {
      find: vi.fn(async (collection: string) => collection === 'teams' ? team : null),
      list: vi.fn(async (collection: string) => ({
        teams: [team, opponent], matches: [match], tournaments: [tournament], players, users: [],
      }[collection] ?? [])),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const service = new TeamsService(records as unknown as never, {} as unknown as never, {} as unknown as never, {} as unknown as never);

    const detail = await service.getDetail('team-1');

    expect(detail?.competitions).toEqual([{ id: 'cup-1', title: 'Coupe Test' }]);
    expect(detail?.members.find((member) => member.playerId === 'player-1')).toMatchObject({
      goals: 1, assists: 0, minutesPlayed: null,
      competitionStats: [{ competitionId: 'cup-1', goals: 1, assists: 0, minutesPlayed: null }],
    });
    expect(detail?.members.find((member) => member.playerId === 'player-2')).toMatchObject({
      goals: 0, assists: 1,
      competitionStats: [{ competitionId: 'cup-1', goals: 0, assists: 1 }],
    });

    const filteredDetail = await service.getDetail('team-1', { competitionId: 'cup-1', sortBy: 'assists' });
    expect(filteredDetail?.members[0]).toMatchObject({ playerId: 'player-2', assists: 1 });
    expect(filteredDetail?.stats.goalDifference).toBe(1);
  });

  it('creates a player profile for every roster entry and normalizes the count', async () => {
    const team = { id: 'team-1', name: 'FC Test', membersCount: 2, members: [
      { playerId: 'legacy-1', name: 'Joueur historique', position: 'Défenseur' },
      { playerId: 'legacy-2', name: 'Deuxième joueur', position: 'Milieu' },
    ] };
    const savedProfiles: Array<{ id: string; name: string }> = [];
    const records = {
      find: vi.fn(async (collection: string) => collection === 'teams' ? team : null),
      list: vi.fn(async (collection: string) => ({ teams: [team], matches: [], tournaments: [], players: [], users: [] }[collection] ?? [])),
      save: vi.fn(async (collection: string, id: string, payload: unknown) => {
        if (collection === 'players') savedProfiles.push(payload as { id: string; name: string });
        return payload;
      }),
    };
    const service = new TeamsService(records as unknown as never, {} as unknown as never, {} as unknown as never, {} as unknown as never);

    const detail = await service.getDetail('team-1');

    expect(savedProfiles).toHaveLength(2);
    expect(detail?.members).toHaveLength(2);
    expect(detail?.membersCount).toBe(2);
    expect(detail?.members.every((member) => savedProfiles.some((profile) => profile.id === member.playerId))).toBe(true);
    expect(records.save).toHaveBeenCalledWith('teams', 'team-1', expect.objectContaining({ membersCount: 2 }));
  });
});

describe('TeamsService listing and membership reads', () => {
  it('filters public teams and removes private ownership fields', async () => {
    const team = { id: 'team-1', ownerId: 'owner-1', name: 'FC Test', city: 'Antananarivo', category: 'Senior', members: [] };
    const records = {
      list: vi.fn(async (collection: string) => ({ teams: [team], matches: [], tournaments: [], players: [] }[collection] ?? [])),
      find: vi.fn(async () => team),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const service = new TeamsService(records as unknown as never, {} as never, {} as never, {} as never);

    await expect(service.list({ query: 'missing' })).resolves.toEqual([]);
    await expect(service.list({ query: 'fc', category: 'Senior', city: 'tana' })).resolves.toMatchObject([{ id: 'team-1', membersCount: 0 }]);
    const result = await service.getById('team-1');
    expect(result).not.toHaveProperty('ownerId');
  });

  it('returns the current team and null for unknown teams', async () => {
    const team = { id: 'team-1', ownerId: 'user-1', name: 'FC Test', members: [] };
    const records = {
      list: vi.fn(async (collection: string) => collection === 'teams' ? [team] : []),
      find: vi.fn(async () => null),
    };
    const accounts = { profile: vi.fn(async () => ({ id: 'user-1' })) };
    const service = new TeamsService(records as unknown as never, accounts as never, {} as never, {} as never);

    await expect(service.myTeam()).resolves.toEqual(team);
    await expect(service.getById('missing')).resolves.toBeNull();
    await expect(service.listPlayers('missing')).resolves.toBeNull();
  });
});
