import { BadRequestException, ForbiddenException, HttpException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { AccountsService } from '../accounts/accounts.service.js';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 6_000;
const MAX_IMAGE_PIXELS = 20_000_000;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 20;
const ALLOWED_PURPOSES = new Set(['avatar', 'marketplace', 'pitch', 'club-logo']);

interface ImageUpload {
  buffer: Buffer;
  mimetype: string;
}

interface ImageInfo {
  extension: 'png' | 'jpg' | 'webp';
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}

function imageDimensions(buffer: Buffer, type: ImageInfo['extension']): { width: number; height: number } | null {
  if (type === 'png' && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (type === 'jpg') {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) return null;
      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
      }
      offset += segmentLength;
    }
    return null;
  }

  if (type === 'webp' && buffer.length >= 30) {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    }
    if (chunk === 'VP8 ' && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L' && buffer[20] === 0x2f && buffer.length >= 25) {
      return {
        width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
        height: 1 + (buffer[22] >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10),
      };
    }
  }
  return null;
}

function inspectImage(file: ImageUpload | undefined): ImageInfo {
  if (!file?.buffer?.length) throw new BadRequestException('Aucun fichier image reçu.');
  if (file.buffer.length > MAX_IMAGE_SIZE) throw new PayloadTooLargeException('Image trop volumineuse (5 Mo maximum).');

  let extension: ImageInfo['extension'];
  let mimeType: ImageInfo['mimeType'];
  if (file.buffer.length >= 24
    && file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && file.buffer.subarray(-8, -4).toString('ascii') === 'IEND') {
    extension = 'png';
    mimeType = 'image/png';
  } else if (file.buffer.length >= 4
    && file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff
    && file.buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]))) {
    extension = 'jpg';
    mimeType = 'image/jpeg';
  } else if (file.buffer.length >= 30
    && file.buffer.toString('ascii', 0, 4) === 'RIFF'
    && file.buffer.toString('ascii', 8, 12) === 'WEBP') {
    extension = 'webp';
    mimeType = 'image/webp';
  } else {
    throw new BadRequestException('Format invalide. Utilisez une image PNG, JPEG ou WebP valide.');
  }

  if (file.mimetype !== mimeType) {
    throw new BadRequestException('Le type MIME ne correspond pas au contenu réel du fichier.');
  }
  const dimensions = imageDimensions(file.buffer, extension);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    throw new BadRequestException('Image invalide ou dimensions illisibles.');
  }
  if (dimensions.width > MAX_IMAGE_DIMENSION || dimensions.height > MAX_IMAGE_DIMENSION
    || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
    throw new BadRequestException('Les dimensions de l’image dépassent la limite autorisée.');
  }
  return { ...dimensions, extension, mimeType };
}

@Injectable()
export class UploadsService {
  private readonly uploadDirectory = resolve(process.env.UPLOAD_DIR || 'uploads');
  private readonly uploadAttempts = new Map<string, { count: number; expiresAt: number }>();

  constructor(private readonly accounts: AccountsService) {}

  async uploadImage(file: ImageUpload | undefined, purpose: string | undefined, clientIp: string) {
    if (!purpose || !ALLOWED_PURPOSES.has(purpose)) {
      throw new BadRequestException('Usage d’image non autorisé.');
    }
    const requiredRole = purpose === 'marketplace' ? 'Vendeur'
      : purpose === 'pitch' ? 'Gestionnaire Terrain'
        : purpose === 'club-logo' ? 'Entraîneur' : undefined;
    if (requiredRole) {
      const user = await this.accounts.profile();
      if (!user?.roles?.includes(requiredRole)) {
        throw new ForbiddenException(`Votre compte doit disposer du rôle ${requiredRole} pour cet upload.`);
      }
    }
    this.enforceRateLimit(clientIp);
    const image = inspectImage(file);
    if (!file) throw new BadRequestException('Aucun fichier image reçu.');
    const filename = `${randomUUID()}.${image.extension}`;
    const filePath = resolve(this.uploadDirectory, filename);
    if (dirname(filePath) !== this.uploadDirectory) throw new BadRequestException('Nom de fichier invalide.');
    await mkdir(this.uploadDirectory, { recursive: true });
    await writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o640 });
    return {
      url: `/api/v1/uploads/${filename}`,
      filename,
      mimeType: image.mimeType,
      size: file.buffer.length,
      width: image.width,
      height: image.height,
    };
  }

  private enforceRateLimit(clientIp: string) {
    const now = Date.now();
    const current = this.uploadAttempts.get(clientIp);
    if (!current || current.expiresAt <= now) {
      this.uploadAttempts.set(clientIp, { count: 1, expiresAt: now + UPLOAD_WINDOW_MS });
      return;
    }
    if (current.count >= MAX_UPLOADS_PER_WINDOW) {
      throw new HttpException('Limite d’upload atteinte. Réessayez plus tard.', 429);
    }
    current.count += 1;
  }
}

export { inspectImage };
