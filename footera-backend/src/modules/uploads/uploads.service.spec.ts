import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UploadsService, MAX_IMAGE_SIZE } from './uploads.service.js';

const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/g1sAAAAASUVORK5CYII=', 'base64');

type ImageRow = { id: string; mimeType: string; content: Buffer };
function makePrisma() {
  const rows = new Map<string, ImageRow>();
  return {
    rows,
    uploadedImageRecord: {
      create: vi.fn(async ({ data }: { data: ImageRow }) => { rows.set(data.id, data); return data; }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),
    },
  };
}

const accountWithRoles = (roles: string[]) => ({ profile: async () => ({ activeRole: 'Joueur', roles }) });

describe('UploadsService security and persistence', () => {
  it('stores a validated PNG in persistent Prisma storage and returns a safe URL', async () => {
    const prisma = makePrisma();
    const service = new UploadsService(accountWithRoles(['Gestionnaire Terrain']) as unknown as never, prisma as unknown as never);
    const uploaded = await service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'pitch', 'test-ip');
    expect(uploaded.filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(uploaded.url).toBe(`/api/v1/uploads/${uploaded.filename}`);
    expect(prisma.uploadedImageRecord.create).toHaveBeenCalledOnce();
    await expect(service.getImage(uploaded.filename)).resolves.toEqual({ buffer: onePixelPng, mimeType: 'image/png' });
  });

  it('rejects unsupported purposes and path-like image ids', async () => {
    const prisma = makePrisma();
    const service = new UploadsService(accountWithRoles(['Joueur']) as unknown as never, prisma as unknown as never);
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, '../private', 'test-ip'))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getImage('../private')).rejects.toMatchObject({ status: 404 });
  });

  it('requires the assigned role for marketplace, pitch, club, and tournament uploads', async () => {
    const prisma = makePrisma();
    const service = new UploadsService(accountWithRoles(['Joueur']) as unknown as never, prisma as unknown as never);
    for (const purpose of ['marketplace', 'pitch', 'club-logo', 'tournament']) {
      await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, purpose, `role-${purpose}`))
        .rejects.toMatchObject({ status: 403 });
    }
  });

  it('allows an assigned role even when another role is active', async () => {
    const prisma = makePrisma();
    const service = new UploadsService(accountWithRoles(['Joueur', 'Gestionnaire Terrain']) as unknown as never, prisma as unknown as never);
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'pitch', 'multi-role-ip'))
      .resolves.toMatchObject({ mimeType: 'image/png' });
  });

  it('rejects MIME spoofing and SVG/script payloads', async () => {
    const service = new UploadsService(accountWithRoles(['Joueur']) as unknown as never, makePrisma() as unknown as never);
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/jpeg' }, 'avatar', 'mime-test'))
      .rejects.toThrow('ne correspond pas');
    await expect(service.uploadImage({ buffer: Buffer.from('<svg onload="alert(1)"/>'), mimetype: 'image/svg+xml' }, 'avatar', 'svg-test'))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized images and decompression-bomb dimensions', async () => {
    const service = new UploadsService(accountWithRoles(['Joueur']) as unknown as never, makePrisma() as unknown as never);
    await expect(service.uploadImage({ buffer: Buffer.alloc(MAX_IMAGE_SIZE + 1), mimetype: 'image/png' }, 'avatar', 'size-test'))
      .rejects.toBeInstanceOf(PayloadTooLargeException);
    const hugeImage = Buffer.from(onePixelPng);
    hugeImage.writeUInt32BE(6_001, 16);
    await expect(service.uploadImage({ buffer: hugeImage, mimetype: 'image/png' }, 'avatar', 'dimension-test'))
      .rejects.toThrow('dimensions');
  });

  it('rate-limits repeated uploads from one client address', async () => {
    const service = new UploadsService(accountWithRoles(['Joueur']) as unknown as never, makePrisma() as unknown as never);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'avatar', 'rate-test-ip');
    }
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'avatar', 'rate-test-ip'))
      .rejects.toMatchObject({ status: 429 });
  });
});