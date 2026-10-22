import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Pitch, SurfaceType } from '../types';

export interface CreatePitchInput {
  name: string;
  complexName: string;
  city: string;
  address: string;
  surface: SurfaceType;
  dimensions: string;
  imageUrl: string;
  hourlyRate: number;
  amenities: string[];
}

export const pitchesService = {
  async list(filters?: { city?: string; surface?: SurfaceType | 'Toutes'; date?: string }): Promise<Pitch[]> {
    if (IS_MOCK_MODE) {
      let pitches = mockStorage.getPitches();
      if (filters?.city && filters.city !== 'Toutes') {
        pitches = pitches.filter((p) => p.city.toLowerCase().includes(filters.city!.toLowerCase()));
      }
      if (filters?.surface && filters.surface !== 'Toutes') {
        pitches = pitches.filter((p) => p.surface === filters.surface);
      }
      if (filters?.date) {
        const bookings = mockStorage.getBookings();
        pitches = pitches.map((pitch) => {
          const bookedTimes = new Set(bookings
            .filter((booking) => booking.pitchId === pitch.id && booking.date === filters.date && booking.status !== 'CANCELLED')
            .map((booking) => booking.time));
          return { ...pitch, availableSlots: pitch.availableSlots.map((slot) => ({
            ...slot,
            isAvailable: slot.isAvailable && !bookedTimes.has(slot.time),
          })) };
        });
      }
      return mockDelay(pitches, 200);
    }
    const params = new URLSearchParams();
    if (filters?.city && filters.city !== 'Toutes') params.set('city', filters.city);
    if (filters?.surface && filters.surface !== 'Toutes') params.set('surface', filters.surface);
    if (filters?.date) params.set('date', filters.date);
    return apiClient<Pitch[]>(`pitches?${params.toString()}`);
  },

  async getById(id: string, date?: string): Promise<Pitch> {
    if (IS_MOCK_MODE) {
      const p = mockStorage.getPitchById(id);
      if (!p) throw new Error('Terrain introuvable');
      if (!date) return mockDelay(p, 150);
      const bookedTimes = new Set(mockStorage.getBookings()
        .filter((booking) => booking.pitchId === p.id && booking.date === date && booking.status !== 'CANCELLED')
        .map((booking) => booking.time));
      return mockDelay({ ...p, availableSlots: p.availableSlots.map((slot) => ({
        ...slot,
        isAvailable: slot.isAvailable && !bookedTimes.has(slot.time),
      })) }, 150);
    }
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const query = params.size ? `?${params.toString()}` : '';
    return apiClient<Pitch>(`pitches/${id}${query}`);
  },

  async create(input: CreatePitchInput): Promise<Pitch> {
    if (IS_MOCK_MODE) {
      const created = mockStorage.createPitch(input);
      return mockDelay(created, 350);
    }
    return apiClient<Pitch>('pitches', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
