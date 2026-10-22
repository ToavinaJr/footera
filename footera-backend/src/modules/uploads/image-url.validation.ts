import { BadRequestException } from '@nestjs/common';

const UPLOADED_IMAGE_PATH = /^\/api\/v1\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp)$/i;

export function validateImageUrl(imageUrl: unknown, label = 'Image'): string {
  if (typeof imageUrl !== 'string' || imageUrl.length > 2_048) {
    throw new BadRequestException(`${label} invalide.`);
  }
  if (UPLOADED_IMAGE_PATH.test(imageUrl)) return imageUrl;

  try {
    const url = new URL(imageUrl);
    if (url.protocol === 'https:' && url.hostname === 'images.unsplash.com' && !url.username && !url.password) {
      return imageUrl;
    }
  } catch {
    // Invalid URL; return the same generic validation failure below.
  }
  throw new BadRequestException(`${label} doit être un upload Footera ou une image HTTPS Unsplash autorisée.`);
}
