import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Pitch, PitchOptions, SurfaceType } from '../types';
import { normalizeDateKey } from '../utils/date';

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

export interface RatePitchInput {
  rating: number;
  comment?: string;
}

export const pitchesService = {
  async getOptions(): Promise<PitchOptions> {
    if (IS_MOCK_MODE) {
      const pitches = mockStorage.getPitches();
      return mockDelay({
        surfaces: [...new Set(pitches.map((pitch) => pitch.surface))],
        amenities: [...new Set(pitches.flatMap((pitch) => pitch.amenities))],
      }, 100);
    }
    return apiClient<PitchOptions>('pitches/options');
  },

  async list(filters?: { city?: string; surface?: SurfaceType | 'Toutes'; date?: string }): Promise<Pitch[]> {
    if (IS_MOCK_MODE) {
      const userId = mockStorage.getProfile().id;
      let pitches = mockStorage.getPitches().map((pitch) => {
        const myReview = pitch.reviews?.find((review) => review.userId === userId);
        return { ...pitch, myReview, myRating: myReview?.rating };
      });
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
            .filter((booking) => booking.pitchId === pitch.id && normalizeDateKey(booking.date) === normalizeDateKey(filters.date!) && booking.status !== 'CANCELLED')
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
      const myReview = p.reviews?.find((review) => review.userId === mockStorage.getProfile().id);
      const pitch = { ...p, myReview, myRating: myReview?.rating };
      if (!date) return mockDelay(pitch, 150);
      const bookedTimes = new Set(mockStorage.getBookings()
        .filter((booking) => booking.pitchId === p.id && normalizeDateKey(booking.date) === normalizeDateKey(date) && booking.status !== 'CANCELLED')
        .map((booking) => booking.time));
      return mockDelay({ ...pitch, availableSlots: p.availableSlots.map((slot) => ({
        ...slot,
        isAvailable: slot.isAvailable && !bookedTimes.has(slot.time),
      })) }, 150);
    }
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const query = params.size ? `?${params.toString()}` : '';
    return apiClient<Pitch>(`pitches/${id}${query}`);
  },

  async rate(id: string, input: RatePitchInput): Promise<Pitch> {
    if (IS_MOCK_MODE) return mockDelay(mockStorage.ratePitch(id, input.rating, input.comment), 250);
    return apiClient<Pitch>(`pitches/${encodeURIComponent(id)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
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
