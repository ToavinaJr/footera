import { describe, expect, it } from 'vitest';
import { updateClubLogoBodyPipe } from './club-logo-request.validation.js';

describe('club logo request validation', () => {
  it('accepts a non-empty logo URL', () => {
    expect(updateClubLogoBodyPipe.transform({ logoUrl: 'https://example.com/logo.png' }))
      .toEqual({ logoUrl: 'https://example.com/logo.png' });
  });

  it('rejects missing, blank, oversized and additional properties', () => {
    expect(() => updateClubLogoBodyPipe.transform({})).toThrow();
    expect(() => updateClubLogoBodyPipe.transform({ logoUrl: ' ' })).toThrow();
    expect(() => updateClubLogoBodyPipe.transform({ logoUrl: 'x'.repeat(2049) })).toThrow();
    expect(() => updateClubLogoBodyPipe.transform({ logoUrl: 'https://example.com/logo.png', ownerId: 'attacker' })).toThrow();
  });
});
