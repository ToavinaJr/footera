import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Booking } from '../types';

export interface CreateBookingInput {
  pitchId: string;
  date: string;
  time: string;
  teamName?: string;
  totalPrice: number;
}

export interface CreateBookingsInput {
  pitchId: string;
  selections: Array<{ date: string; time: string }>;
  teamName?: string;
}

export interface BookingQuoteInput {
  pitchId: string;
  selections: Array<{ date: string; time: string }>;
}

export interface BookingQuote {
  total: number;
  perDate: Record<string, number>;
}

export const bookingsService = {
  async quote(input: BookingQuoteInput): Promise<BookingQuote> {
    if (IS_MOCK_MODE) {
      const bookings = mockStorage.getBookings();
      const pitch = mockStorage.getPitchById(input.pitchId);
      if (!pitch) throw new Error('Terrain introuvable');
      const perDate: Record<string, number> = {};
      for (const selection of input.selections) {
        const slot = pitch.availableSlots.find((candidate) => candidate.time === selection.time);
        const isBooked = bookings.some((booking) => booking.pitchId === input.pitchId
          && booking.date === selection.date && booking.time === selection.time && booking.status !== 'CANCELLED');
        if (!slot || isBooked) throw new Error('Un créneau sélectionné n’est plus disponible.');
        perDate[selection.date] = (perDate[selection.date] || 0) + slot.price;
      }
      return mockDelay({ total: Object.values(perDate).reduce((total, price) => total + price, 0), perDate }, 100);
    }
    return apiClient<BookingQuote>('bookings/quote', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async list(): Promise<Booking[]> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getBookings(), 200);
    }
    return apiClient<Booking[]>('bookings');
  },

  async requestBooking(input: CreateBookingInput): Promise<Booking> {
    if (IS_MOCK_MODE) {
      const b = mockStorage.createBooking(input);
      return mockDelay(b, 400);
    }
    return apiClient<Booking>('bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async requestBookings(input: CreateBookingsInput): Promise<Booking[]> {
    if (IS_MOCK_MODE) {
      const pitch = mockStorage.getPitchById(input.pitchId);
      if (!pitch || !Array.isArray(input.selections) || !input.selections.length) throw new Error('Sélection de créneaux invalide.');
      const seen = new Set<string>();
      const currentBookings = mockStorage.getBookings();
      for (const selection of input.selections) {
        const key = `${selection.date}:${selection.time}`;
        const slot = pitch.availableSlots.find((candidate) => candidate.time === selection.time && candidate.isAvailable);
        const isBooked = currentBookings.some((booking) => booking.pitchId === input.pitchId
          && booking.date === selection.date && booking.time === selection.time && booking.status !== 'CANCELLED');
        if (seen.has(key) || !slot || isBooked) throw new Error('Un des créneaux sélectionnés n’est plus disponible.');
        seen.add(key);
      }
      const created = input.selections.map((selection) => mockStorage.createBooking({
        pitchId: input.pitchId,
        ...selection,
        teamName: input.teamName,
        totalPrice: 0,
      }));
      return mockDelay(created, 400);
    }
    return apiClient<Booking[]>('bookings/batch', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async cancelBooking(bookingId: string): Promise<boolean> {
    if (IS_MOCK_MODE) {
      const ok = mockStorage.cancelBooking(bookingId);
      return mockDelay(ok, 300);
    }
    return apiClient<boolean>(`bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  },
};
