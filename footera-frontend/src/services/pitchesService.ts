import { apiClient } from '../lib/api/client';
import type { Pitch, PitchOptions, SurfaceType } from '../types';

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
  getOptions(): Promise<PitchOptions> {
    return apiClient<PitchOptions>('pitches/options');
  },

  async list(filters?: { city?: string; surface?: SurfaceType | 'Toutes'; date?: string }): Promise<Pitch[]> {
    const params = new URLSearchParams();
    if (filters?.city && filters.city !== 'Toutes') params.set('city', filters.city);
    if (filters?.surface && filters.surface !== 'Toutes') params.set('surface', filters.surface);
    if (filters?.date) params.set('date', filters.date);
    const query = params.size ? `?${params.toString()}` : '';
    return apiClient<Pitch[]>(`pitches${query}`);
  },

  async getById(id: string, date?: string): Promise<Pitch> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const query = params.size ? `?${params.toString()}` : '';
    return apiClient<Pitch>(`pitches/${encodeURIComponent(id)}${query}`);
  },

  rate(id: string, input: RatePitchInput): Promise<Pitch> {
    return apiClient<Pitch>(`pitches/${encodeURIComponent(id)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  create(input: CreatePitchInput): Promise<Pitch> {
    return apiClient<Pitch>('pitches', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
