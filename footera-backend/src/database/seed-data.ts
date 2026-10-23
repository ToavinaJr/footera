import {
  SEED_ACTIVITY_FEED, SEED_APPLICATIONS, SEED_BOOKINGS, SEED_CLUBS,
  SEED_MARKETPLACE, SEED_MATCHES,
  SEED_NOTIFICATIONS, SEED_PITCHES, SEED_PLAYERS, SEED_RECRUITMENT_ADS,
  SEED_TEAMS, SEED_TOURNAMENTS, SEED_USER, SEED_CATALOGS,
} from './seeds.js';
import { PrismaService } from './prisma.service.js';
import { asJson, RECORD_MODELS, RecordCollection, type RecordDelegate } from './record.repository.js';
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
  ['activity', 'id', SEED_ACTIVITY_FEED],
  ['catalogs', 'id', SEED_CATALOGS],
];

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map(asObject) : [];
}

function delegateFor(prisma: PrismaService, collection: RecordCollection): RecordDelegate {
  return (prisma as unknown as Record<string, RecordDelegate>)[RECORD_MODELS[collection]];
}

export async function seedDatabase(prisma: PrismaService, { reset = false } = {}) {
  if (reset) {
    for (const collection of Object.keys(RECORD_MODELS) as RecordCollection[]) {
      await delegateFor(prisma, collection).deleteMany();
    }
  }

  for (const [collection, key, records] of collections) {
    const delegate = delegateFor(prisma, collection);
    for (const [index, rawPayload] of records.entries()) {
      const payload = asObject(rawPayload);
      const id = String(payload[key] ?? `${collection}_${index + 1}`);
      const existing = await delegate.findUnique({ where: { id } });
      if (existing) {
        const current = asObject(existing.payload);
        if (collection === 'notifications' && !current.createdAt) {
          await delegate.update({ where: { id }, data: { payload: { ...current, createdAt: new Date().toISOString() } } });
        }
        if (collection === 'players' && payload.userId && !current.userId) {
          await delegate.update({ where: { id }, data: { payload: { ...current, userId: payload.userId } } });
        }
        if (collection === 'teams' && payload.ownerId && !current.ownerId) {
          await delegate.update({ where: { id }, data: { payload: { ...current, ownerId: payload.ownerId } } });
        }
        if (collection === 'teams' && payload.competitionId && !current.competitionId) {
          await delegate.update({ where: { id }, data: { payload: { ...current, competitionId: payload.competitionId } } });
        }
        if (collection === 'matches' && payload.tournamentId && !current.tournamentId) {
          const seededEvents = asObjectArray(payload.events);
          const storedEvents = asObjectArray(current.events);
          const events = storedEvents.map((event, eventIndex) => {
            const seededEvent = seededEvents[eventIndex];
            if (!seededEvent || event.playerId || !seededEvent.playerId) return event;
            return { ...event, playerId: seededEvent.playerId,
              ...(seededEvent.assistPlayerId && !event.assistPlayerId ? { assistPlayerId: seededEvent.assistPlayerId } : {}),
              ...(seededEvent.assist && !event.assist ? { assist: seededEvent.assist } : {}),
            };
          });
          await delegate.update({ where: { id }, data: { payload: asJson({ ...current, tournamentId: payload.tournamentId, events }) } });
        }
        continue;
      }
      const seedPayload = collection === 'notifications' && !payload.createdAt
        ? { ...payload, createdAt: new Date().toISOString() }
        : payload;
      await delegate.create({ data: { id, payload: asJson(seedPayload) } });
    }
  }

  const notificationDelegate = delegateFor(prisma, 'notifications');
  const legacyNotifications = await notificationDelegate.findMany();
  for (const record of legacyNotifications) {
    const payload = asObject(record.payload);
    if (payload.recipientId) continue;
    await notificationDelegate.update({
      where: { id: record.id },
      data: { payload: asJson({ ...payload, recipientId: SEED_USER.id }) },
    });
  }

  const seedPassword = process.env.SEED_USER_PASSWORD;
  const credentials = delegateFor(prisma, 'authCredentials');
  if (seedPassword && !await credentials.findUnique({ where: { id: SEED_USER.email.toLowerCase() } })) {
    if (seedPassword.length < 12) throw new Error('SEED_USER_PASSWORD must contain at least 12 characters.');
    const salt = randomBytes(16);
    const hash = await derivePasswordKey(seedPassword, salt);
    const passwordHash = `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`;
    await credentials.create({
      data: { id: SEED_USER.email.toLowerCase(), payload: { userId: SEED_USER.id, passwordHash } },
    });
  }
}
