import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateSportsCvPayload } from './sports-cv.validation.js';

const positions = ['Gardien', 'Milieu Central'];
const strongFeet = ['Droitier', 'Gaucher', 'Ambidextre'];

describe('validateSportsCvPayload', () => {
  it('accepts values from the supplied database catalogs and trims text fields', () => {
    expect(validateSportsCvPayload({
      primaryPosition: 'Milieu Central',
      height: 182,
      weight: 75,
      currentTeam: '  Betsileo FC  ',
      bio: '  Milieu relayeur  ',
    }, positions, strongFeet)).toEqual({
      primaryPosition: 'Milieu Central',
      height: 182,
      weight: 75,
      currentTeam: 'Betsileo FC',
      bio: 'Milieu relayeur',
    });
  });

  it('rejects unknown catalog values, out-of-range values, and privileged fields', () => {
    expect(() => validateSportsCvPayload({ height: 500 }, positions, strongFeet)).toThrow(BadRequestException);
    expect(() => validateSportsCvPayload({ primaryPosition: 'Coach' }, positions, strongFeet)).toThrow(BadRequestException);
    expect(() => validateSportsCvPayload({ strongFoot: 'Unknown' }, positions, strongFeet)).toThrow(BadRequestException);
    expect(() => validateSportsCvPayload({ roles: ['Entraîneur'] }, positions, strongFeet)).toThrow(BadRequestException);
    expect(() => validateSportsCvPayload({}, positions, strongFeet)).toThrow(BadRequestException);
  });
});
