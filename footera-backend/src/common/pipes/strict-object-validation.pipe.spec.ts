import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { StrictObjectValidationPipe } from './strict-object-validation.pipe.js';

const pipe = new StrictObjectValidationPipe({
  fields: {
    email: { required: true, validate: (value) => typeof value === 'string' && value.includes('@'), message: 'Email invalide.' },
    password: { required: true, validate: (value) => typeof value === 'string' && value.length >= 12, message: 'Mot de passe trop court.' },
  },
});

describe('StrictObjectValidationPipe', () => {
  it('accepts a valid object and returns it unchanged', () => {
    const body = { email: 'user@example.com', password: 'a-secure-password' };
    expect(pipe.transform(body)).toBe(body);
  });

  it('rejects non-object bodies, unknown properties, missing fields, and invalid values', () => {
    for (const body of [null, [], 'email=user@example.com', { email: 'user@example.com', password: 'a-secure-password', role: 'Admin' }, { email: 'invalid', password: 'short' }]) {
      expect(() => pipe.transform(body)).toThrow(BadRequestException);
    }
  });

  it('allows sparse update schemas but rejects empty updates when configured', () => {
    const updatePipe = new StrictObjectValidationPipe({
      requireAtLeastOne: true,
      fields: { city: { validate: (value) => typeof value === 'string', message: 'Ville invalide.' } },
    });
    expect(updatePipe.transform({ city: 'Antananarivo' })).toEqual({ city: 'Antananarivo' });
    expect(() => updatePipe.transform({})).toThrow(BadRequestException);
  });
});
