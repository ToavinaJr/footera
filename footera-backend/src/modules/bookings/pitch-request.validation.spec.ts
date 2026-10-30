import { describe, expect, it } from 'vitest';
import { createPitchBodyPipe } from './pitch-request.validation.js';

const validPitch = {
  name: 'Terrain central', complexName: 'Footera Arena', city: 'Antananarivo', address: 'Centre-ville',
  surface: 'Gazon synthétique', gameFormat: '7v7', dimensions: '50m x 30m',
  imageUrl: 'https://images.unsplash.com/photo-123?auto=format', hourlyRate: 50_000, amenities: ['Vestiaires'],
};

describe('pitch request validation', () => {
  it('accepts a complete pitch payload with a game format', () => {
    expect(createPitchBodyPipe.transform(validPitch)).toEqual(validPitch);
  });

  it('rejects a missing format and unexpected properties', () => {
    const { gameFormat: _gameFormat, ...withoutFormat } = validPitch;
    expect(() => createPitchBodyPipe.transform(withoutFormat)).toThrow();
    expect(() => createPitchBodyPipe.transform({ ...validPitch, extra: true })).toThrow();
  });
});