import {
  SEED_ACTIVITY_FEED, SEED_APPLICATIONS, SEED_BOOKINGS, SEED_CLUBS,
  SEED_LEAGUE_STANDINGS, SEED_MARKETPLACE, SEED_MATCHES,
  SEED_NOTIFICATIONS, SEED_PITCHES, SEED_PLAYERS, SEED_RECRUITMENT_ADS,
  SEED_TEAMS, SEED_TOURNAMENTS, SEED_USER,
} from './seeds.js';
import { PrismaService } from './prisma.service.js';
import { RECORD_MODELS, RecordCollection } from './record.repository.js';

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
        continue;
      }
      const seedPayload = collection === 'notifications' && !payload.createdAt
        ? { ...payload, createdAt: new Date().toISOString() }
        : payload;
      await delegate.create({ data: { id, payload: seedPayload } });
    }
  }
}
