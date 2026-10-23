import {
  SEED_ACTIVITY_FEED, SEED_APPLICATIONS, SEED_BOOKINGS, SEED_CLUBS,
  SEED_LEAGUE_STANDINGS, SEED_MARKETPLACE, SEED_MATCHES,
  SEED_NOTIFICATIONS, SEED_PITCHES, SEED_PLAYERS, SEED_RECRUITMENT_ADS,
  SEED_TEAMS, SEED_TOURNAMENTS, SEED_USER, SEED_CATALOGS,
} from './seeds.js';
import { PrismaService } from './prisma.service.js';
import { RECORD_MODELS, RecordCollection } from './record.repository.js';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';

function derivePasswordKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

const collections: Array<[RecordCollection, string, unknown[]]> = [
  ['users', 'id', [SEED_USER]],
  ['players', 'id', SEED_PLAYERS],
  ['teams', 'id', SEED_TEAMS],
  ['clubs', 'id', SEED_CLUBS],
  ['matches', 'id', SEED_MATCHES],
  ['tournaments', 'id', SEED_TOURNAMENTS],
  ['pitches', 'id', SEED_PITCHES],
  ['bookings', 'id', SEED_BOOKINGS],
  ['recruitmentAds', 'id', SEED_RECRUITMENT_ADS],
  ['applications', 'id', SEED_APPLICATIONS],
  ['marketplace', 'id', SEED_MARKETPLACE],
  ['notifications', 'id', SEED_NOTIFICATIONS],
  ['standings', 'position', SEED_LEAGUE_STANDINGS],
  ['activity', 'id', SEED_ACTIVITY_FEED],
  ['catalogs', 'id', SEED_CATALOGS],
];

export async function seedDatabase(prisma: PrismaService, { reset = false } = {}) {
  if (reset) {
    for (const [, model] of Object.entries(RECORD_MODELS)) {
      await (prisma as any)[model].deleteMany();
    }
  }

  for (const [collection, key, records] of collections) {
    const delegate = (prisma as any)[RECORD_MODELS[collection]];
    for (const payload of records as Array<Record<string, any>>) {
      const id = String(payload[key] ?? `${collection}_${records.indexOf(payload) + 1}`);
      const existing = await delegate.findUnique({ where: { id } });
      if (existing) {
        if (collection === 'notifications' && !existing.payload.createdAt) {
          await delegate.update({ where: { id }, data: { payload: { ...existing.payload, createdAt: new Date().toISOString() } } });
        }
        if (collection === 'players' && payload.userId && !existing.payload.userId) {
          await delegate.update({ where: { id }, data: { payload: { ...existing.payload, userId: payload.userId } } });
        }
        if (collection === 'teams' && payload.ownerId && !existing.payload.ownerId) {
          await delegate.update({ where: { id }, data: { payload: { ...existing.payload, ownerId: payload.ownerId } } });
        }
        continue;
      }
      const seedPayload = collection === 'notifications' && !payload.createdAt
        ? { ...payload, createdAt: new Date().toISOString() }
        : payload;
      await delegate.create({ data: { id, payload: seedPayload } });
    }
  }

  const seedPassword = process.env.SEED_USER_PASSWORD;
  if (seedPassword && !await (prisma as any).authCredentialRecord.findUnique({ where: { id: SEED_USER.email.toLowerCase() } })) {
    if (seedPassword.length < 12) throw new Error('SEED_USER_PASSWORD must contain at least 12 characters.');
    const salt = randomBytes(16);
    const hash = await derivePasswordKey(seedPassword, salt);
    const passwordHash = `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`;
    await (prisma as any).authCredentialRecord.create({
      data: { id: SEED_USER.email.toLowerCase(), payload: { userId: SEED_USER.id, passwordHash } },
    });
  }
}
