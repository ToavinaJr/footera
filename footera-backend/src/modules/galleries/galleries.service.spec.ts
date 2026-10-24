import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { GalleriesService } from './galleries.service.js';
import type { RecordRepository } from '../../database/record.repository.js';
import type { UserContext } from '../auth/user-context.js';

function makeService(record: Record<string, unknown>, userId = 'owner') {
  let currentRecord = record;
  const records = {
    find: vi.fn(async () => currentRecord),
    list: vi.fn(async () => []),
    save: vi.fn(async (_collection: string, _id: string, payload: unknown) => {
      currentRecord = payload as Record<string, unknown>;
      return payload;
    }),
  } as unknown as RecordRepository;
  const context = { userId } as UserContext;
  return { service: new GalleriesService(records, context), records };
}

describe('GalleriesService', () => {
  it('adds and removes images from an owned player gallery', async () => {
    const { service, records } = makeService({ id: 'player-1', userId: 'owner', galleryImages: [] });
    const imageUrl = '/api/v1/uploads/0185de4c-54b4-4ca7-babb-2d653e0eab0d.jpg';

    await expect(service.add('players', 'player-1', imageUrl)).resolves.toEqual({ images: [imageUrl] });
    await expect(service.remove('players', 'player-1', imageUrl)).resolves.toEqual({ images: [] });
    expect(records.save).toHaveBeenCalledTimes(2);
  });

  it('rejects edits from a different account', async () => {
    const { service, records } = makeService({ id: 'player-1', userId: 'another-user', galleryImages: [] });
    await expect(service.add('players', 'player-1', '/api/v1/uploads/0185de4c-54b4-4ca7-babb-2d653e0eab0d.jpg'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(records.save).not.toHaveBeenCalled();
  });

  it('replaces a photo without changing gallery order', async () => {
    const first = '/api/v1/uploads/0185de4c-54b4-4ca7-babb-2d653e0eab0d.jpg';
    const second = '/api/v1/uploads/1185de4c-54b4-4ca7-babb-2d653e0eab0d.webp';
    const { service } = makeService({ id: 'player-1', userId: 'owner', galleryImages: [first] });
    await expect(service.replace('players', 'player-1', first, second)).resolves.toEqual({ images: [second] });
  });
});
