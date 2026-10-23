import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UploadsService, MAX_IMAGE_SIZE } from './uploads.service.js';

const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/g1sAAAAASUVORK5CYII=', 'base64');

describe('UploadsService security', () => {
  let uploadDirectory: string;
  let service: UploadsService;

  beforeEach(async () => {
    uploadDirectory = await mkdtemp(join(tmpdir(), 'footera-uploads-'));
    vi.stubEnv('UPLOAD_DIR', uploadDirectory);
    service = new UploadsService({ profile: async () => ({ activeRole: 'Joueur', roles: ['Joueur'] }) } as unknown as never);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(uploadDirectory, { recursive: true, force: true });
  });

  it('accepts a PNG and replaces the client filename with a random safe name', async () => {
    const result = await service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'avatar', 'test-ip');
    expect(result.filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(result.url).toBe(`/api/v1/uploads/${result.filename}`);
    expect(await readFile(join(uploadDirectory, result.filename))).toEqual(onePixelPng);
  });

  it('rejects unsupported purposes before writing a file', async () => {
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, '../private', 'test-ip'))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires the corresponding assigned role for marketplace, pitch and club media', async () => {
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'marketplace', 'role-test-ip'))
      .rejects.toMatchObject({ status: 403 });
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'pitch', 'role-test-ip'))
      .rejects.toMatchObject({ status: 403 });
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'club-logo', 'role-test-ip'))
      .rejects.toMatchObject({ status: 403 });
  });

  it('allows an upload when the required role is assigned but another role is active', async () => {
    const multiRoleService = new UploadsService({
      profile: async () => ({ activeRole: 'Joueur', roles: ['Joueur', 'Vendeur'] }),
    } as unknown as never);
    await expect(multiRoleService.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'marketplace', 'multi-role-ip'))
      .resolves.toMatchObject({ mimeType: 'image/png' });
  });

  it('rejects MIME spoofing and SVG/script payloads', async () => {
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/jpeg' }, 'avatar', 'test-ip'))
      .rejects.toThrow('ne correspond pas');
    await expect(service.uploadImage({ buffer: Buffer.from('<svg onload="alert(1)"/>'), mimetype: 'image/svg+xml' }, 'avatar', 'test-ip'))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized images and decompression-bomb dimensions', async () => {
    await expect(service.uploadImage({ buffer: Buffer.alloc(MAX_IMAGE_SIZE + 1), mimetype: 'image/png' }, 'avatar', 'test-ip'))
      .rejects.toBeInstanceOf(PayloadTooLargeException);
    const hugeImage = Buffer.from(onePixelPng);
    hugeImage.writeUInt32BE(6_001, 16);
    await expect(service.uploadImage({ buffer: hugeImage, mimetype: 'image/png' }, 'avatar', 'test-ip'))
      .rejects.toThrow('dimensions');
  });

  it('rate-limits repeated uploads from the same client address', async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'avatar', 'rate-test-ip');
    }
    await expect(service.uploadImage({ buffer: onePixelPng, mimetype: 'image/png' }, 'avatar', 'rate-test-ip'))
      .rejects.toMatchObject({ status: 429 });
  });
});
