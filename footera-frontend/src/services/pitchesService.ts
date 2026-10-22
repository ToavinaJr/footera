import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Pitch, SurfaceType, PitchSlot } from '../types';

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
  availableSlots: PitchSlot[];
}

export const pitchesService = {
  async list(filters?: { city?: string; surface?: SurfaceType | 'Toutes' }): Promise<Pitch[]> {
    if (IS_MOCK_MODE) {
      let pitches = mockStorage.getPitches();
      if (filters?.city && filters.city !== 'Toutes') {
        pitches = pitches.filter((p) => p.city.toLowerCase().includes(filters.city!.toLowerCase()));
      }
      if (filters?.surface && filters.surface !== 'Toutes') {
        pitches = pitches.filter((p) => p.surface === filters.surface);
      }
      return mockDelay(pitches, 200);
    }
    const params = new URLSearchParams();
    if (filters?.city && filters.city !== 'Toutes') params.set('city', filters.city);
    return apiClient<Pitch[]>(`pitches?${params.toString()}`);
  },

  async getById(id: string): Promise<Pitch> {
    if (IS_MOCK_MODE) {
      const p = mockStorage.getPitchById(id);
      if (!p) throw new Error('Terrain introuvable');
      return mockDelay(p, 150);
    }
    return apiClient<Pitch>(`pitches/${id}`);
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
