import { Injectable, OnModuleInit } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { toCamelCase } from '../../utils/text.utils.js';
import { SEED_CATALOGS } from '../../database/seeds.js';

export interface CatalogOptions {
  pitchSurfaces: string[];
  pitchFormats: string[];
  pitchAmenities: string[];
  tournamentFormats: string[];
  marketplaceCategories: string[];
  marketplaceConditions: string[];
  marketplaceBrands: string[];
  playerPositions: string[];
  recruitmentPositions: string[];
  playerLevels: string[];
  strongFeet: string[];
}

@Injectable()
export class CatalogsService implements OnModuleInit {
  constructor(private readonly records: RecordRepository) {}

  async onModuleInit() {
    if (process.env.NODE_ENV !== 'production') return;
    const existing = new Map((await this.records.list<{ id: string; values?: unknown }>('catalogs')).map((record) => [record.id, record]));
    for (const catalog of SEED_CATALOGS) {
      const persisted = existing.get(catalog.id);
      const hasValues = Array.isArray(persisted?.values)
        && persisted.values.some((value) => typeof value === 'string' && value.trim().length > 0);
      if (hasValues) continue;
      if (persisted) {
        await this.records.save('catalogs', catalog.id, catalog);
        continue;
      }
      try {
        await this.records.create('catalogs', catalog.id, catalog);
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') continue;
        throw error;
      }
    }
  }

  async options(): Promise<CatalogOptions> {
    const records = await this.records.list<{ id: string; values: string[] }>('catalogs');
    const persisted = Object.fromEntries(records.map(({ id, values }) => [
      toCamelCase(id),
      Array.isArray(values) ? values.filter((value) => typeof value === 'string' && value.trim()) : [],
    ])) as unknown as Partial<CatalogOptions>;
    return {
      pitchSurfaces: [], pitchFormats: [], pitchAmenities: [], tournamentFormats: [],
      marketplaceCategories: [], marketplaceConditions: [], marketplaceBrands: [], playerPositions: [],
      recruitmentPositions: [], playerLevels: [], strongFeet: [],
      ...persisted,
    };
  }

  async values(id: keyof CatalogOptions): Promise<string[]> {
    const options = await this.options();
    return options[id] ?? [];
  }
}
