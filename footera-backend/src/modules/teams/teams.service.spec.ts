import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TeamsService } from './teams.service.js';

function makeService(existingInvitations: any[] = []) {
  const team = { id: 'team-1', name: 'FC Test', city: 'Antananarivo', members: [] };
  const player = { id: 'player-1', name: 'Joueur Test' };
  const user = { id: 'usr_me', name: 'Responsable' };
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
