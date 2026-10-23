import { apiClient } from '../lib/api/client';
import type { CatalogOptions } from '../types';

export const catalogsService = {
  getOptions(): Promise<CatalogOptions> {
    return apiClient<CatalogOptions>('catalogs');
  },
};
