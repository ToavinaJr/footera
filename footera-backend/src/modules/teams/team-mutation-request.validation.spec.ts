import { describe, expect, it } from 'vitest';
import {
  joinTeamBodyPipe,
  remindTeamMembersBodyPipe,
  updateTeamJoinRequestBodyPipe,
} from './team-mutation-request.validation.js';

describe('team mutation request validation', () => {
  it('accepts valid join, update and reminder payloads', () => {
    const joinRequest = { message: 'Je souhaite rejoindre votre équipe.', position: 'Avant-centre' };
    expect(joinTeamBodyPipe.transform(joinRequest)).toEqual(joinRequest);
    expect(updateTeamJoinRequestBodyPipe.transform(joinRequest)).toEqual(joinRequest);
    expect(remindTeamMembersBodyPipe.transform({ message: 'Entraînement samedi.' }))
      .toEqual({ message: 'Entraînement samedi.' });
  });

  it('rejects missing, oversized and unexpected fields', () => {
    expect(() => joinTeamBodyPipe.transform({ message: 'Salut' })).toThrow();
    expect(() => updateTeamJoinRequestBodyPipe.transform({ message: 'x'.repeat(501), position: 'Avant-centre' })).toThrow();
    expect(() => remindTeamMembersBodyPipe.transform({ message: 'Rappel', ownerId: 'attacker' })).toThrow();
    expect(() => remindTeamMembersBodyPipe.transform({ message: 'x'.repeat(1001) })).toThrow();
  });
});
