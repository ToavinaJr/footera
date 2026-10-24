import { describe, expect, it } from 'vitest';
import { loginBodyPipe, profileBodyPipe, registerBodyPipe } from './auth-request.validation.js';

describe('authentication request validation', () => {
  it('accepts valid registration and login bodies', () => {
    expect(registerBodyPipe.transform({ name: 'Footera Player', email: 'player@example.com', password: 'secure-password-12' }))
      .toMatchObject({ email: 'player@example.com' });
    expect(loginBodyPipe.transform({ email: 'player@example.com', password: 'valid-password' }))
      .toMatchObject({ email: 'player@example.com' });
  });

  it('rejects malformed credentials and unexpected role injection', () => {
    expect(() => registerBodyPipe.transform({ name: 'X', email: 'bad', password: 'short', role: 'Admin' })).toThrow();
    expect(() => loginBodyPipe.transform({ email: 'bad', password: 'valid-password' })).toThrow();
    expect(() => loginBodyPipe.transform({ email: 'player@example.com', password: 'valid-password', userId: 'other' })).toThrow();
  });

  it('validates sparse profile updates and rejects empty or unknown updates', () => {
    expect(profileBodyPipe.transform({ phone: '+261 34 12 345 67' })).toEqual({ phone: '+261 34 12 345 67' });
    expect(() => profileBodyPipe.transform({})).toThrow();
    expect(() => profileBodyPipe.transform({ email: 'attacker@example.com' })).toThrow();
  });
});
