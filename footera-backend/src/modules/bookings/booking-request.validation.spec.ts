import { describe, expect, it } from 'vitest';
import { createBookingBatchBodyPipe, createBookingBodyPipe, quoteBookingsBodyPipe } from './booking-request.validation.js';

const validSelection = { date: 'Samedi 24 Octobre 2026', time: '07:00 - 09:00' };

describe('booking request validation', () => {
  it('accepts quote, batch, and single-booking payloads used by the API', () => {
    expect(quoteBookingsBodyPipe.transform({ pitchId: 'pitch-1', selections: [validSelection] }))
      .toMatchObject({ pitchId: 'pitch-1' });
    expect(createBookingBatchBodyPipe.transform({ pitchId: 'pitch-1', selections: [validSelection], teamName: 'Footera FC' }))
      .toMatchObject({ teamName: 'Footera FC' });
    expect(createBookingBodyPipe.transform({ pitchId: 'pitch-1', date: validSelection.date, time: validSelection.time }))
      .toMatchObject({ date: validSelection.date });
  });

  it('rejects malformed, unknown, and excessive nested booking data', () => {
    expect(() => quoteBookingsBodyPipe.transform({ pitchId: 'pitch-1', selections: [] })).toThrow();
    expect(() => quoteBookingsBodyPipe.transform({ pitchId: 'pitch-1', selections: [{ ...validSelection, price: 1 }] })).toThrow();
    expect(() => createBookingBatchBodyPipe.transform({ pitchId: 'pitch-1', selections: [validSelection], totalPrice: 1 })).toThrow();
    expect(() => quoteBookingsBodyPipe.transform({ pitchId: 'pitch-1', selections: Array.from({ length: 31 }, () => validSelection) })).toThrow();
    expect(() => createBookingBodyPipe.transform({ pitchId: 'pitch-1', date: validSelection.date })).toThrow();
    expect(() => createBookingBodyPipe.transform({ pitchId: 'pitch-1', date: validSelection.date, time: validSelection.time, userId: 'attacker' })).toThrow();
  });
});
