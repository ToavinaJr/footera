import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { MarketplaceListing } from '../types';

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
  async categories(): Promise<string[]> {
    if (IS_MOCK_MODE) {
      const categories = [...new Set(mockStorage.getMarketplace().map((item) => item.category))];
      return mockDelay(categories, 100);
    }
    return apiClient<string[]>('marketplace/categories');
  },

  async list(filters?: { query?: string; category?: string; maxPrice?: number }): Promise<MarketplaceListing[]> {
    if (IS_MOCK_MODE) {
      let items = mockStorage.getMarketplace();
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        items = items.filter((i) => i.title.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q) || i.city.toLowerCase().includes(q));
      }
      if (filters?.category && filters.category !== 'Toutes') {
        items = items.filter((i) => i.category === filters.category);
      }
      if (filters?.maxPrice && filters.maxPrice > 0) {
        items = items.filter((i) => i.price <= filters.maxPrice!);
      }
      return mockDelay(items, 200);
    }
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    if (filters?.category && filters.category !== 'Toutes') params.set('category', filters.category);
    if (filters?.maxPrice && filters.maxPrice > 0) params.set('maxPrice', String(filters.maxPrice));
    return apiClient<MarketplaceListing[]>(`marketplace?${params.toString()}`);
  },

  async createListing(input: CreateListingInput): Promise<MarketplaceListing> {
    if (IS_MOCK_MODE) {
      const created = mockStorage.createMarketplaceListing(input);
      return mockDelay(created, 350);
    }
    return apiClient<MarketplaceListing>('marketplace', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
