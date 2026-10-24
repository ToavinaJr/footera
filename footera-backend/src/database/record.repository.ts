import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { RecordPayloadMap } from '../types/records.js';

export interface StoredRecord { id: string; payload: unknown }
export interface RecordDelegate {
  findMany(args?: { orderBy?: { id: 'asc' } }): Promise<StoredRecord[]>;
  findUnique(args: { where: { id: string } }): Promise<StoredRecord | null>;
  upsert(args: { where: { id: string }; create: { id: string; payload: Prisma.InputJsonValue }; update: { payload: Prisma.InputJsonValue } }): Promise<StoredRecord>;
  create(args: { data: { id: string; payload: Prisma.InputJsonValue } }): Promise<StoredRecord>;
  update(args: { where: { id: string }; data: { payload: Prisma.InputJsonValue } }): Promise<StoredRecord>;
  deleteMany(args?: { where?: { id: string } }): Promise<{ count: number }>;
  count(): Promise<number>;
}
type DynamicRecordClient = Record<string, RecordDelegate>;

export const asJson = (payload: unknown): Prisma.InputJsonValue => payload as Prisma.InputJsonValue;

export const RECORD_MODELS = {
  users: 'userRecord',
  authCredentials: 'authCredentialRecord',
  authSessions: 'authSessionRecord',
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
  teamInvitations: 'teamInvitationRecord',
  teamJoinRequests: 'teamJoinRequestRecord',
  standings: 'leagueStandingRecord',
  activity: 'activityFeedRecord',
  catalogs: 'catalogRecord',
} as const;

export type RecordCollection = keyof typeof RECORD_MODELS;

@Injectable()
export class RecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  private delegate(collection: RecordCollection): RecordDelegate {
    return (this.prisma as unknown as DynamicRecordClient)[RECORD_MODELS[collection]];
  }

  async list<C extends RecordCollection>(collection: C): Promise<RecordPayloadMap[C][]>;
  async list<T>(collection: RecordCollection): Promise<T[]>;
  async list(collection: RecordCollection): Promise<unknown[]> {
    const records = await this.delegate(collection).findMany({ orderBy: { id: 'asc' } });
    return records.map((record) => record.payload);
  }

  async find<C extends RecordCollection>(collection: C, id: string): Promise<RecordPayloadMap[C] | null>;
  async find<T>(collection: RecordCollection, id: string): Promise<T | null>;
  async find(collection: RecordCollection, id: string): Promise<unknown | null> {
    const record = await this.delegate(collection).findUnique({ where: { id } });
    return record ? record.payload : null;
  }

  async save<T>(collection: RecordCollection, id: string, payload: T): Promise<T> {
    const record = await this.delegate(collection).upsert({
      where: { id },
      create: { id, payload: asJson(payload) },
      update: { payload: asJson(payload) },
    });
    return record.payload as T;
  }

  async create<T>(collection: RecordCollection, id: string, payload: T): Promise<T> {
    const record = await this.delegate(collection).create({ data: { id, payload: asJson(payload) } });
    return record.payload as T;
  }

  async resolveTeamJoinRequest(
    requestId: string,
    request: Record<string, unknown>,
    team?: { id: string; payload: Record<string, unknown> },
    player?: { id: string; payload: Record<string, unknown> },
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const client = transaction as unknown as DynamicRecordClient;
      if (team) await client.teamRecord.update({ where: { id: team.id }, data: { payload: asJson(team.payload) } });
      if (player) await client.playerRecord.update({ where: { id: player.id }, data: { payload: asJson(player.payload) } });
      await client.teamJoinRequestRecord.update({ where: { id: requestId }, data: { payload: asJson(request) } });
    });
  }

  async createUserAccount<T>(id: string, email: string, user: T, credential: { userId: string; passwordHash: string }, player?: unknown): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const client = transaction as unknown as DynamicRecordClient;
      await client.userRecord.create({ data: { id, payload: asJson(user) } });
      await client.authCredentialRecord.create({ data: { id: email, payload: asJson(credential) } });
      if (player) await client.playerRecord.create({ data: { id, payload: asJson(player) } });
    });
  }

  async consumeAuthSession(id: string): Promise<boolean> {
    const result = await (this.delegate('authSessions')).deleteMany({ where: { id } });
    return result.count === 1;
  }

  async deleteAll(collection: RecordCollection): Promise<void> {
    await this.delegate(collection).deleteMany();
  }

  async count(collection: RecordCollection): Promise<number> {
    return this.delegate(collection).count();
  }
}
