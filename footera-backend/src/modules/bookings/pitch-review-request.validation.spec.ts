import { describe, expect, it } from 'vitest';
import { ratePitchBodyPipe } from './pitch-review-request.validation.js';

describe('pitch review request validation', () => {
  it('accepts integer ratings with an optional bounded comment', () => {
    expect(ratePitchBodyPipe.transform({ rating: 5 })).toEqual({ rating: 5 });
    expect(ratePitchBodyPipe.transform({ rating: 3, comment: 'Bon terrain' }))
      .toEqual({ rating: 3, comment: 'Bon terrain' });
  });

  it('rejects invalid ratings, long comments and unexpected fields', () => {
    expect(() => ratePitchBodyPipe.transform({ rating: 5.5 })).toThrow();
    expect(() => ratePitchBodyPipe.transform({ rating: 0 })).toThrow();
    expect(() => ratePitchBodyPipe.transform({ rating: 5, comment: 'x'.repeat(501) })).toThrow();
    expect(() => ratePitchBodyPipe.transform({ rating: 5, userId: 'attacker' })).toThrow();
  });
});
