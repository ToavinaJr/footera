import { describe, expect, it } from 'vitest';
import { addMarketplaceBrandBodyPipe } from './marketplace-brand-request.validation.js';

describe('marketplace brand request validation', () => {
  it('accepts a valid brand name', () => {
    expect(addMarketplaceBrandBodyPipe.transform({ brand: 'Footera' })).toEqual({ brand: 'Footera' });
  });

  it('rejects blank, oversized and unexpected fields', () => {
    expect(() => addMarketplaceBrandBodyPipe.transform({ brand: ' ' })).toThrow();
    expect(() => addMarketplaceBrandBodyPipe.transform({ brand: 'x'.repeat(81) })).toThrow();
    expect(() => addMarketplaceBrandBodyPipe.transform({ brand: 'Footera', isAdmin: true })).toThrow();
  });
});
