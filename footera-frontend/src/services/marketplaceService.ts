import { apiClient } from '../lib/api/client';
import type { MarketplaceListing } from '../types';

export interface CreateListingInput {
  title: string;
  category: MarketplaceListing['category'];
  price: number;
  condition: MarketplaceListing['condition'];
  brand: string;
  size?: string;
  city: string;
  imageUrl: string;
  description: string;
}

export const marketplaceService = {
  getById(id: string): Promise<MarketplaceListing> {
    return apiClient<MarketplaceListing>(`marketplace/${encodeURIComponent(id)}`);
  },
  categories(): Promise<string[]> {
    return apiClient<string[]>('marketplace/categories');
  },

  async list(filters?: { query?: string; category?: string; maxPrice?: number }): Promise<MarketplaceListing[]> {
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    if (filters?.category && filters.category !== 'Toutes') params.set('category', filters.category);
    if (filters?.maxPrice && filters.maxPrice > 0) params.set('maxPrice', String(filters.maxPrice));
    return apiClient<MarketplaceListing[]>(`marketplace?${params.toString()}`);
  },

  createListing(input: CreateListingInput): Promise<MarketplaceListing> {
    return apiClient<MarketplaceListing>('marketplace', { method: 'POST', body: JSON.stringify(input) });
  },
};
