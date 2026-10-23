import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { RecordRepository } from '../../database/record.repository.js';
import type { AuthCredentialRecord, AuthSessionRecord, UserRecord } from '../../database/domain-records.js';
import { calculateAge } from '../accounts/calculate-age.js';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function derivePasswordKey(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  activeRole: string;
}

@Injectable()
export class AuthService {
  private readonly secret = this.loadSecret();

  constructor(private readonly records: RecordRepository) {}

  private loadSecret() {
    if (process.env.JWT_SECRET) {
      if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
      if (process.env.JWT_SECRET.startsWith('replace-with-')) throw new Error('Replace the example JWT_SECRET with a randomly generated secret.');
      return process.env.JWT_SECRET;
    }
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be configured in production.');
    return randomBytes(32).toString('base64url');
  }

  async register(input: { name?: unknown; email?: unknown; password?: unknown }) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    if (name.length < 2 || name.length > 80) throw new BadRequestException('Le nom doit contenir entre 2 et 80 caractères.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new BadRequestException('Adresse e-mail invalide.');
    if (password.length < 12 || password.length > 256) throw new BadRequestException('Le mot de passe doit contenir au moins 12 caractères.');
    const role = 'Joueur';

    if (await this.records.find('authCredentials', email)) throw new ConflictException('Un compte utilise déjà cette adresse e-mail.');
    const id = `usr_${randomUUID()}`;
    const passwordHash = await this.hashPassword(password);
    const user = {
      id, name, email, phone: '', city: '', avatarUrl: '', activeRole: role, roles: [role],
      favoriteTeamIds: [], favoriteMatchIds: [], favoriteTournamentIds: [],
      sportsCv: { height: 0, weight: 0, strongFoot: '', primaryPosition: '', secondaryPosition: '', experienceYears: 0, preferredNumber: 0, currentTeam: '', bio: '' },
    };
    const player = role === 'Joueur' ? {
        id, userId: id, name, age: 0, city: '', avatarUrl: '', primaryPosition: '', secondaryPosition: '',
        strongFoot: '', currentTeam: '', currentTeamId: '', level: '', height: 0, weight: 0,
        appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0,
        isAvailableForTransfer: false, rating: 0, bio: '', previousClubs: [], teamHistoryStats: [],
      } : undefined;
    try {
      await this.records.createUserAccount(id, email, user, { userId: id, passwordHash }, player);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Un compte utilise déjà cette adresse e-mail.');
      }
      throw error;
    }
    return { user: this.toPublicUser(user), ...(await this.createSession(id)) };
  }

  async login(input: { email?: unknown; password?: unknown }) {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    const credential = await this.records.find<AuthCredentialRecord>('authCredentials', email);
    const user = credential ? await this.records.find<UserRecord>('users', credential.userId) : null;
    if (password.length > 256) throw new UnauthorizedException('Adresse e-mail ou mot de passe incorrect.');
    const valid = credential?.passwordHash
      ? await this.verifyPassword(password, credential.passwordHash)
      : (await this.hashPassword('invalid-login-attempt'), false);
    if (!valid || !user) throw new UnauthorizedException('Adresse e-mail ou mot de passe incorrect.');
    return { user: this.toPublicUser(user), ...(await this.createSession(user.id)) };
  }

  async refresh(refreshToken: string) {
    const sessionId = this.hashRefreshToken(refreshToken);
    const session = await this.records.find<AuthSessionRecord>('authSessions', sessionId);
    if (!session || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
      if (session) await this.records.consumeAuthSession(sessionId);
      throw new UnauthorizedException('Session expirée. Veuillez vous reconnecter.');
    }
    if (!await this.records.consumeAuthSession(sessionId)) throw new UnauthorizedException('Session déjà renouvelée.');
    const user = await this.records.find('users', session.userId);
    if (!user) throw new UnauthorizedException('Session invalide.');
    return this.createSession(session.userId);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken || refreshToken.length > 128) return;
    await this.records.consumeAuthSession(this.hashRefreshToken(refreshToken));
  }

  async validateSession(id: string, sessionId: string) {
    const [user, session] = await Promise.all([
      this.records.find<UserRecord>('users', id),
      this.records.find<AuthSessionRecord>('authSessions', sessionId),
    ]);
    if (!user || session?.userId !== id || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
      throw new UnauthorizedException('Session invalide ou expirée.');
    }
    return true;
  }

  async getProfile(id: string) {
    const user = await this.records.find<UserRecord>('users', id);
    if (!user) return null;
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { ...safeUser, age: calculateAge(user.dateOfBirth) };
  }

  verifyToken(token: string): { id: string; sessionId: string } {
    try {
      if (token.length > 4096) throw new Error('Invalid token');
      const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
      if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error('Invalid token');
      const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      if (header.alg !== 'HS256' || payload.iss !== 'footera-api' || payload.aud !== 'footera-web'
        || typeof payload.sub !== 'string' || typeof payload.sid !== 'string'
        || !Number.isInteger(payload.iat) || !Number.isInteger(payload.exp)
        || payload.iat > Math.floor(Date.now() / 1000) || payload.exp <= Math.floor(Date.now() / 1000)) {
        throw new Error('Invalid token');
      }
      const expected = this.sign(`${encodedHeader}.${encodedPayload}`);
      const expectedBuffer = Buffer.from(expected);
      const actualBuffer = Buffer.from(encodedSignature);
      if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) throw new Error('Invalid token');
      return { id: payload.sub, sessionId: payload.sid };
    } catch {
      throw new UnauthorizedException('Session invalide ou expirée.');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = await derivePasswordKey(password, salt, 64);
    return `scrypt$16384$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
  }

  private async verifyPassword(password: string, encoded: string): Promise<boolean> {
    const [algorithm, n, r, p, saltEncoded, hashEncoded] = encoded.split('$');
    if (algorithm !== 'scrypt' || n !== '16384' || r !== '8' || p !== '1' || !saltEncoded || !hashEncoded) return false;
    const expected = Buffer.from(hashEncoded, 'base64url');
    const actual = await derivePasswordKey(password, Buffer.from(saltEncoded, 'base64url'), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private issueToken(userId: string, sessionId: string) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ iss: 'footera-api', aud: 'footera-web', sub: userId, sid: sessionId, iat: now, exp: now + ACCESS_TOKEN_TTL_SECONDS })).toString('base64url');
    return `${header}.${payload}.${this.sign(`${header}.${payload}`)}`;
  }

  private async createSession(userId: string) {
    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();
    const sessionId = this.hashRefreshToken(refreshToken);
    await this.records.create('authSessions', sessionId, { userId, expiresAt });
    return { accessToken: this.issueToken(userId, sessionId), refreshToken, accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS };
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private sign(value: string) {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }

  private toPublicUser(user: UserRecord): AuthenticatedUser {
    return { id: user.id, email: user.email, name: user.name, roles: user.roles || ['Joueur'], activeRole: user.activeRole || 'Joueur' };
  }
}
