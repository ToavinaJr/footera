import { describe, expect, it, vi } from 'vitest';
import { RecruitmentService } from './recruitment.service.js';

describe('RecruitmentService applications', () => {
  it('returns only applications belonging to the authenticated user', async () => {
    const records = {
      list: vi.fn(async () => [
        { id: 'mine', userId: 'user-1', submittedAt: '2026-10-22T00:00:00.000Z' },
        { id: 'other', userId: 'user-2', submittedAt: '2026-10-23T00:00:00.000Z' },
        { id: 'legacy', submittedAt: '2026-10-24T00:00:00.000Z' },
      ]),
    };
    const accounts = { profile: vi.fn(async () => ({ id: 'user-1' })) };
    const service = new RecruitmentService(records as unknown as never, accounts as unknown as never, {} as unknown as never);

    await expect(service.listApplications()).resolves.toEqual([
      expect.objectContaining({ id: 'mine', userId: 'user-1' }),
    ]);
  });

  it('stores the authenticated user id on new applications', async () => {
    const ad = { id: 'ad-1', positionSought: 'Gardien', teamName: 'FC Test', candidatesCount: 0 };
    const records = {
      find: vi.fn(async () => ad),
      create: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const user = { id: 'user-1', name: 'Joueur', phone: '123', sportsCv: { primaryPosition: 'Gardien' } };
    const accounts = { profile: vi.fn(async () => user) };
    const notifications = { add: vi.fn(async () => undefined) };
    const service = new RecruitmentService(records as unknown as never, accounts as unknown as never, notifications as unknown as never);

    const application = await service.apply('ad-1', { message: 'Disponible', phone: '' });

    expect(application.userId).toBe('user-1');
    expect(records.create).toHaveBeenCalledWith('applications', application.id, application);
  });

  it('keeps the application successful if its notification cannot be created', async () => {
    const ad = { id: 'ad-1', positionSought: 'Gardien', teamName: 'FC Test', candidatesCount: 0 };
    const records = {
      find: vi.fn(async () => ad),
      create: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const accounts = { profile: vi.fn(async () => ({ id: 'user-1', name: 'Joueur' })) };
    const notifications = { add: vi.fn(async () => { throw new Error('Notification indisponible'); }) };
    const service = new RecruitmentService(records as unknown as never, accounts as unknown as never, notifications as unknown as never);

    const application = await service.apply('ad-1', { message: 'Disponible', phone: '0340000000' });

    expect(application.userId).toBe('user-1');
    expect(records.create).toHaveBeenCalledWith('applications', application.id, application);
  });
});
