import { describe, expect, it } from 'vitest';
import { applyRecruitmentBodyPipe } from './recruitment-request.validation.js';

describe('recruitment application request validation', () => {
  it('accepts a valid application body', () => {
    expect(applyRecruitmentBodyPipe.transform({ message: 'Disponible les week-ends.', phone: '+261 34 12 345 67' }))
      .toMatchObject({ message: 'Disponible les week-ends.' });
  });

  it('rejects empty messages, invalid phone numbers, and extra fields', () => {
    expect(() => applyRecruitmentBodyPipe.transform({ message: ' ', phone: '' })).toThrow();
    expect(() => applyRecruitmentBodyPipe.transform({ message: 'Disponible', phone: 'not a phone' })).toThrow();
    expect(() => applyRecruitmentBodyPipe.transform({ message: 'Disponible', phone: '0340000000', userId: 'attacker' })).toThrow();
  });
});
