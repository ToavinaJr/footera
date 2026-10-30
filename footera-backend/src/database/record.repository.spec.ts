import { describe, expect, it, vi } from 'vitest';
import { RecordRepository } from './record.repository.js';

function createRepository() {
  const delegate = () => ({
    findMany: vi.fn(async () => [{ id: 'record-1', payload: { id: 'record-1' } }]),
    findUnique: vi.fn(async () => ({ id: 'record-1', payload: { id: 'record-1' } })),
    upsert: vi.fn(async ({ update }: { update: { payload: unknown } }) => ({ id: 'record-1', payload: update.payload })),
    create: vi.fn(async ({ data }: { data: { id: string; payload: unknown } }) => ({ id: data.id, payload: data.payload })),
    update: vi.fn(async ({ data }: { data: { payload: unknown } }) => ({ id: 'record-1', payload: data.payload })),
    updateMany: vi.fn(async () => ({ count: 1 })),
    deleteMany: vi.fn(async () => ({ count: 1 })),
    count: vi.fn(async () => 3),
  });
  const delegates = {
    userRecord: delegate(), authCredentialRecord: delegate(), authSessionRecord: delegate(),
    playerRecord: delegate(), teamRecord: delegate(), teamJoinRequestRecord: delegate(),
    activityFeedRecord: delegate(), bookingRecord: delegate(), bookingSlotClaimRecord: delegate(),
  } as Record<string, ReturnType<typeof delegate>>;
  const prisma = {
    ...delegates,
    authLoginAttemptRecord: {
      deleteMany: vi.fn(async () => undefined),
      findUnique: vi.fn(async () => ({ attempts: 2, expiresAt: new Date(Date.now() + 60_000) })),
      upsert: vi.fn(async () => ({ attempts: 3 })),
    },
    $executeRaw: vi.fn(async () => 1),
    $transaction: vi.fn(async (callback: (transaction: typeof prisma) => unknown) => callback(prisma)),
  };
  return { repository: new RecordRepository(prisma as never), prisma, delegates };
}

describe('RecordRepository', () => {
  it('supports basic collection CRUD operations', async () => {
    const { repository, delegates } = createRepository();
    await expect(repository.list('users')).resolves.toEqual([{ id: 'record-1' }]);
    await expect(repository.find('users', 'record-1')).resolves.toEqual({ id: 'record-1' });
    await expect(repository.save('users', 'user-1', { name: 'A' })).resolves.toEqual({ name: 'A' });
    await expect(repository.create('users', 'user-2', { name: 'B' })).resolves.toEqual({ name: 'B' });
    await expect(repository.deleteOne('users', 'user-2')).resolves.toBe(true);
    await expect(repository.count('users')).resolves.toBe(3);
    await expect(repository.deleteAll('users')).resolves.toBeUndefined();
    expect(delegates.userRecord.findMany).toHaveBeenCalledWith({ orderBy: { id: 'asc' } });
  });

  it('performs atomic user and team updates', async () => {
    const { repository, prisma } = createRepository();
    await repository.setUserFavorite('user-1', 'favoriteTeamIds', 'team-1', true);
    await repository.updateUserPreferences('user-1', { language: 'en' });
    await repository.resolveTeamJoinRequest('request-1', { status: 'ACCEPTED' },
      { id: 'team-1', payload: { members: [] } }, { id: 'player-1', payload: { currentTeamId: 'team-1' } });
    await repository.leaveTeamAtomically(
      { id: 'team-1', payload: {} }, { id: 'player-1', payload: {} }, { id: 'user-1', payload: {} },
    );
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('reserves bookings atomically and converts duplicate claims into a conflict result', async () => {
    const { repository, prisma } = createRepository();
    const entries = [{ id: 'booking-1', pitchId: 'pitch-1', dateKey: '2026-10-30', time: '18:00', payload: {} }];
    await expect(repository.reserveBookingsAtomically(entries)).resolves.toBe(true);
    prisma.$transaction.mockImplementationOnce(async () => { throw { code: 'P2002' }; });
    await expect(repository.reserveBookingsAtomically(entries)).resolves.toBe(false);
    prisma.$transaction.mockImplementationOnce(async () => { throw new Error('database down'); });
    await expect(repository.reserveBookingsAtomically(entries)).rejects.toThrow('database down');
  });

  it('cancels bookings and manages login failures and sessions', async () => {
    const { repository, delegates, prisma } = createRepository();
    await repository.cancelBookingAndReleaseSlot('booking-1', { status: 'CANCELLED' });
    await expect(repository.getLoginFailureCount('login-1', new Date())).resolves.toBe(2);
    await expect(repository.recordLoginFailure('login-1', new Date(), new Date(Date.now() + 60_000))).resolves.toBe(3);
    await expect(repository.clearLoginFailures('login-1')).resolves.toBeUndefined();
    await expect(repository.createUserAccount('user-1', 'user@example.test', { name: 'A' }, { userId: 'user-1', passwordHash: 'hash' }, { id: 'player-1' })).resolves.toBeUndefined();
    await expect(repository.consumeAuthSession('session-1')).resolves.toBe(true);
    await expect(repository.listUserSessions('user-1')).resolves.toEqual([{ id: 'record-1' }]);
    await expect(repository.changePasswordAndRevokeSessions('user@example.test', 'user-1', 'old', 'new')).resolves.toBe(true);
    expect(delegates.bookingRecord.update).toHaveBeenCalled();
    expect(prisma.authLoginAttemptRecord.deleteMany).toHaveBeenCalled();
  });

  it('publishes activity without failing the business operation when persistence fails', async () => {
    const { repository, delegates } = createRepository();
    await expect(repository.publishActivity('teams', 'team-1', 'Team updated')).resolves.toBeUndefined();
    delegates.activityFeedRecord.create.mockRejectedValueOnce(new Error('activity unavailable'));
    await expect(repository.publishActivity('teams', 'team-1', 'Team updated')).resolves.toBeUndefined();
  });
});
