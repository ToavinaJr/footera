import { Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';

export interface CatalogOptions {
  pitchSurfaces: string[];
  pitchAmenities: string[];
  marketplaceCategories: string[];
  marketplaceConditions: string[];
  marketplaceBrands: string[];
  playerPositions: string[];
  recruitmentPositions: string[];
  playerLevels: string[];
  strongFeet: string[];
}

@Injectable()
export class CatalogsService {
  constructor(private readonly records: RecordRepository) {}

  async options(): Promise<CatalogOptions> {
    const records = await this.records.list<{ id: string; values: string[] }>('catalogs');
    const persisted = Object.fromEntries(records.map(({ id, values }) => [
      id.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
      Array.isArray(values) ? values.filter((value) => typeof value === 'string' && value.trim()) : [],
    ])) as unknown as Partial<CatalogOptions>;
    return {
      pitchSurfaces: [], pitchAmenities: [], marketplaceCategories: [], marketplaceConditions: [],
      marketplaceBrands: [], playerPositions: [], recruitmentPositions: [], playerLevels: [], strongFeet: [],
      ...persisted,
    };
  }

  async values(id: keyof CatalogOptions): Promise<string[]> {
    const options = await this.options();
    return options[id] ?? [];
  }
}
