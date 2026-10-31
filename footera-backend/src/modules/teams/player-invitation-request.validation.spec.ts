import { describe, expect, it } from 'vitest';
import { invitePlayerBodyPipe } from './player-invitation-request.validation.js';

describe('player invitation request validation', () => {
  it('accepts an optional valid message', () => {
    expect(invitePlayerBodyPipe.transform({})).toEqual({});
    expect(invitePlayerBodyPipe.transform({ message: 'Rejoignez notre équipe.' }))
      .toEqual({ message: 'Rejoignez notre équipe.' });
  });

  it('rejects blank, oversized and unexpected fields', () => {
    expect(() => invitePlayerBodyPipe.transform({ message: ' ' })).toThrow();
    expect(() => invitePlayerBodyPipe.transform({ message: 'x'.repeat(501) })).toThrow();
    expect(() => invitePlayerBodyPipe.transform({ message: 'Invitation', teamId: 'other-team' })).toThrow();
  });
});
