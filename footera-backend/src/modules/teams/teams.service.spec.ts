import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TeamsService } from './teams.service.js';

function makeService(existingInvitations: any[] = []) {
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
  return { service: new TeamsService(records as any, accounts as any, notifications as any), records, notifications };
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
    };
    const service = new TeamsService(records as any, {} as any, {} as any);

    const detail = await service.getDetail('team-1');

    expect(detail?.competitions).toEqual([{ id: 'cup-1', title: 'Coupe Test' }]);
    expect(detail?.members.find((member: any) => member.playerId === 'player-1')).toMatchObject({
      goals: 1, assists: 0, minutesPlayed: null,
      competitionStats: [{ competitionId: 'cup-1', goals: 1, assists: 0, minutesPlayed: null }],
    });
    expect(detail?.members.find((member: any) => member.playerId === 'player-2')).toMatchObject({
      goals: 0, assists: 1,
      competitionStats: [{ competitionId: 'cup-1', goals: 0, assists: 1 }],
    });
  });
});
