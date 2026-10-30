import { describe, expect, it } from 'vitest';
import { createMarketplaceBodyPipe } from './marketplace-request.validation.js';

const validListing = {
  title: 'Chaussures de football',
  category: 'Chaussures',
  condition: 'Très bon état',
  brand: 'Footera',
  price: 120_000,
  imageUrl: 'https://images.unsplash.com/photo-123',
  city: 'Antananarivo',
  description: 'Chaussures en très bon état.',
};

describe('marketplace request validation', () => {
  it('accepts a valid listing and the optional size field', () => {
    expect(createMarketplaceBodyPipe.transform({ ...validListing, size: '42 EU' }))
      .toMatchObject({ title: validListing.title, size: '42 EU' });
  });

  it('rejects non-positive prices, unsupported image URLs, and client-controlled fields', () => {
    expect(() => createMarketplaceBodyPipe.transform({ ...validListing, price: 0 })).toThrow();
    expect(() => createMarketplaceBodyPipe.transform({ ...validListing, imageUrl: 'http://example.com/image.png' })).toThrow();
    expect(() => createMarketplaceBodyPipe.transform({ ...validListing, sellerRating: 5 })).toThrow();
  });
});
