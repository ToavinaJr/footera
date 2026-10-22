import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

export const RECORD_MODELS = {
  users: 'userRecord',
  players: 'playerRecord',
  teams: 'teamRecord',
  clubs: 'clubRecord',
  matches: 'matchRecord',
  tournaments: 'tournamentRecord',
  pitches: 'pitchRecord',
  bookings: 'bookingRecord',
  recruitmentAds: 'recruitmentAdRecord',
  applications: 'applicationRecord',
  marketplace: 'marketplaceRecord',
  notifications: 'notificationRecord',
  standings: 'leagueStandingRecord',
  activity: 'activityFeedRecord',
  catalogs: 'catalogRecord',
} as const;

export type RecordCollection = keyof typeof RECORD_MODELS;

@Injectable()
export class RecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  private delegate(collection: RecordCollection): any {
    return (this.prisma as any)[RECORD_MODELS[collection]];
  }

  async list<T>(collection: RecordCollection): Promise<T[]> {
    const records = await this.delegate(collection).findMany({ orderBy: { id: 'asc' } });
    return records.map((record: { payload: T }) => record.payload);
  }

  async find<T>(collection: RecordCollection, id: string): Promise<T | null> {
    const record = await this.delegate(collection).findUnique({ where: { id } });
    return record?.payload ?? null;
  }

  async save<T>(collection: RecordCollection, id: string, payload: T): Promise<T> {
    const record = await this.delegate(collection).upsert({
      where: { id },
      create: { id, payload: payload as any },
      update: { payload: payload as any },
    });
    return record.payload as T;
  }

  async create<T>(collection: RecordCollection, id: string, payload: T): Promise<T> {
    const record = await this.delegate(collection).create({ data: { id, payload: payload as any } });
    return record.payload as T;
  }

  async deleteAll(collection: RecordCollection): Promise<void> {
    await this.delegate(collection).deleteMany();
  }

  async count(collection: RecordCollection): Promise<number> {
    return this.delegate(collection).count();
  }
}
