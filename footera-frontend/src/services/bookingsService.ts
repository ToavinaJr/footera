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

export const bookingsService = {
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
