import { BadRequestException, ConflictException, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { RecordCollection, RecordRepository } from '../../database/record.repository.js';
import type { AuthCredentialRecord, AuthSessionRecord, UserRecord } from '../../database/domain-records.js';
import { AuthService } from './auth.service.js';

function makeService() {
  type AuthRecord = AuthCredentialRecord | AuthSessionRecord | UserRecord;
  const records = {
    find: vi.fn(async (_collection: RecordCollection, _id: string): Promise<AuthRecord | null> => null),
    createUserAccount: vi.fn(async (_id: string, _email: string, _user: UserRecord, _credential: AuthCredentialRecord, _player?: unknown) => undefined),
    create: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    consumeAuthSession: vi.fn(async () => true),
    getLoginFailureCount: vi.fn(async () => 0),
    recordLoginFailure: vi.fn(async () => 1),
    clearLoginFailures: vi.fn(async () => undefined),
    consumeRateLimit: vi.fn(async () => true),
  };
  return { auth: new AuthService(records as unknown as RecordRepository), records };
}

describe('AuthService', () => {
  it('registers with a password hash and issues a verifiable session token', async () => {
    const { auth, records } = makeService();

    const result = await auth.register({ name: 'Test User', email: 'TEST@example.com', password: 'correct horse battery staple' });

    expect(records.createUserAccount).toHaveBeenCalledOnce();
    const [id, email, user, credentials] = records.createUserAccount.mock.calls[0]!;
    expect(email).toBe('test@example.com');
    expect(user.roles).toEqual(['Joueur']);
    expect(user.activeRole).toBe('Joueur');
    expect(user).not.toHaveProperty('passwordHash');
    expect(credentials.passwordHash).toMatch(/^scrypt\$/);
    expect(auth.verifyToken(result.accessToken).id).toBe(id);
  });

  it('ignores a client-supplied role and assigns only the default role', async () => {
    const { auth, records } = makeService();

    const input = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'correct horse battery staple',
      role: 'Administrateur',
    };
    await auth.register(input);

    const [, , user] = records.createUserAccount.mock.calls[0]!;
    expect(user.roles).toEqual(['Joueur']);
    expect(user.activeRole).toBe('Joueur');
  });

  it('rate limits account creation by a hashed client address before account persistence', async () => {
    const { auth, records } = makeService();
    records.consumeRateLimit.mockResolvedValueOnce(true).mockResolvedValue(false);

    const result = await auth.register({ name: 'Test User', email: 'test@example.com', password: 'correct horse battery staple' }, '203.0.113.42');
    const rateLimitError = await auth.register({ name: 'Test User', email: 'second@example.com', password: 'correct horse battery staple' }, '203.0.113.42')
      .catch((error: unknown) => error);

    expect(result.user.email).toBe('test@example.com');
    expect(rateLimitError).toBeInstanceOf(HttpException);
    expect((rateLimitError as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(records.consumeRateLimit).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/), expect.any(Date), 60 * 60 * 1000, 20);
    expect(records.consumeRateLimit.mock.calls[0]?.[0]).not.toContain('203.0.113.42');
    expect(records.createUserAccount).toHaveBeenCalledOnce();
  });

  it('rejects duplicate email addresses', async () => {
    const { auth, records } = makeService();
    records.find.mockResolvedValueOnce({ userId: 'existing', passwordHash: 'stored' });

    await expect(auth.register({ name: 'Test User', email: 'test@example.com', password: 'correct horse battery staple' }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('authenticates with the stored password hash and rejects a wrong password', async () => {
    const { auth, records } = makeService();
    await auth.register({ name: 'Test User', email: 'test@example.com', password: 'correct horse battery staple' });
    const [id, , user, credential] = records.createUserAccount.mock.calls[0]!;
    records.find.mockImplementation(async (collection: RecordCollection, _id: string) => {
      if (collection === 'authCredentials') return credential;
      if (collection === 'users') return user;
      return null;
    });

    const result = await auth.login({ email: 'TEST@example.com', password: 'correct horse battery staple' });
    expect(result.user.id).toBe(id);
    await expect(auth.login({ email: 'test@example.com', password: 'wrong password' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(records.recordLoginFailure).toHaveBeenCalledOnce();
    expect(records.clearLoginFailures).toHaveBeenCalledOnce();
  });

  it('rejects extra password-change fields before looking up account data', async () => {
    const { auth, records } = makeService();

    await expect(auth.changePassword('user-1', {
      currentPassword: 'current-password',
      newPassword: 'a sufficiently long replacement password',
      userId: 'victim',
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(records.find).not.toHaveBeenCalled();
  });

  it('blocks an address and email pair after the persistent failure limit is reached', async () => {
    const { auth, records } = makeService();
    records.getLoginFailureCount.mockResolvedValue(10);

    const error = await auth.login({ email: 'person@example.com', password: 'wrong password' }, '192.0.2.10').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(records.find).not.toHaveBeenCalled();
    expect(records.getLoginFailureCount.mock.calls[0]?.[0]).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rotates refresh sessions and rejects replay of a consumed token', async () => {
    const { auth, records } = makeService();
    const registration = await auth.register({ name: 'Test User', email: 'test@example.com', password: 'correct horse battery staple' });
    const [userId, , user] = records.createUserAccount.mock.calls[0]!;
    const refreshToken = registration.refreshToken;
    records.find.mockImplementation(async (collection: RecordCollection, _id: string) => {
      if (collection === 'authSessions') return { userId, expiresAt: new Date(Date.now() + 60_000).toISOString() };
      if (collection === 'users') return user;
      return null;
    });

    const rotated = await auth.refresh(refreshToken);
    expect(rotated.refreshToken).not.toBe(refreshToken);
    records.consumeAuthSession.mockResolvedValueOnce(false);
    await expect(auth.refresh(refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invalid or expired sessions and incorrect login credentials', async () => {
    const { auth } = makeService();
    await expect(auth.login({ email: 'unknown@example.com', password: 'a sufficiently long password' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(() => auth.verifyToken('not.a.token')).toThrow(UnauthorizedException);
  });
});
