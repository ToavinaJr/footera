import { describe, expect, it } from 'vitest';
import {
  addGalleryImageBodyPipe,
  removeGalleryImageBodyPipe,
  replaceGalleryImageBodyPipe,
} from './gallery-request.validation.js';

describe('gallery request validation', () => {
  it('accepts the exact payloads required by gallery mutations', () => {
    expect(addGalleryImageBodyPipe.transform({ imageUrl: 'https://example.com/new.jpg' }))
      .toEqual({ imageUrl: 'https://example.com/new.jpg' });
    expect(replaceGalleryImageBodyPipe.transform({
      previousImageUrl: 'https://example.com/old.jpg',
      imageUrl: 'https://example.com/new.jpg',
    })).toEqual({ previousImageUrl: 'https://example.com/old.jpg', imageUrl: 'https://example.com/new.jpg' });
    expect(removeGalleryImageBodyPipe.transform({ imageUrl: 'https://example.com/old.jpg' }))
      .toEqual({ imageUrl: 'https://example.com/old.jpg' });
  });

  it('rejects unexpected properties and missing or malformed image URLs', () => {
    expect(() => addGalleryImageBodyPipe.transform({ imageUrl: 'https://example.com/a.jpg', ownerId: 'attacker' })).toThrow();
    expect(() => addGalleryImageBodyPipe.transform({ imageUrl: ' ' })).toThrow();
    expect(() => removeGalleryImageBodyPipe.transform({})).toThrow();
    expect(() => replaceGalleryImageBodyPipe.transform({
      previousImageUrl: 'https://example.com/old.jpg',
      imageUrl: 'https://example.com/new.jpg',
      galleryImages: [],
    })).toThrow();
  });
});
