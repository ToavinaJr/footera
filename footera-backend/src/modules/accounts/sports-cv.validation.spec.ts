import { BadRequestException } from '@nestjs/common';
import { validateSportsCvPayload } from './sports-cv.validation.js';

describe('validateSportsCvPayload', () => {
  it('accepts valid partial CV updates and trims text fields', () => {
    expect(validateSportsCvPayload({
      primaryPosition: 'Milieu Central',
      height: 182,
      weight: 75,
      currentTeam: '  Betsileo FC  ',
      bio: '  Milieu relayeur  ',
    })).toEqual({
      primaryPosition: 'Milieu Central',
      height: 182,
      weight: 75,
      currentTeam: 'Betsileo FC',
      bio: 'Milieu relayeur',
    });
  });

  it('rejects out-of-range values, invalid enums, and privileged fields', () => {
    expect(() => validateSportsCvPayload({ height: 500 })).toThrow(BadRequestException);
    expect(() => validateSportsCvPayload({ primaryPosition: 'Coach' })).toThrow(BadRequestException);
    expect(() => validateSportsCvPayload({ roles: ['Entraîneur'] })).toThrow(BadRequestException);
    expect(() => validateSportsCvPayload({})).toThrow(BadRequestException);
  });
});
