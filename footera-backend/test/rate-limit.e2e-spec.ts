import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RecordRepository } from '../src/database/record.repository.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe.skipIf(process.env.CI !== 'true')('PostgreSQL rate limit persistence (e2e)', () => {
  let prisma: PrismaService;
  let records: RecordRepository;
  let id: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    records = new RecordRepository(prisma);
    await prisma.$connect();
  });

  afterAll(async () => {
    if (id) await prisma.authLoginAttemptRecord.deleteMany({ where: { id } });
    await prisma?.$disconnect();
  });

  it('enforces one shared limit across concurrent requests and resets after expiry', async () => {
    id = `e2e-${randomUUID()}`;
    const now = new Date();
    const windowMs = 60_000;
    const limit = 2;

    await expect(records.consumeRateLimit(id, now, windowMs, limit)).resolves.toBe(true);
    const concurrentAttempts = await Promise.all(
      Array.from({ length: 3 }, () => records.consumeRateLimit(id, now, windowMs, limit)),
    );
    expect(concurrentAttempts.filter(Boolean)).toHaveLength(limit - 1);

    await expect(records.consumeRateLimit(id, new Date(now.getTime() + windowMs + 1), windowMs, limit))
      .resolves.toBe(true);
  });
});
