import { BadRequestException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogsService } from './catalogs.service.js';

const originalNodeEnv = process.env.NODE_ENV;

function createService() {
  const records = {
    list: vi.fn(async () => []),
    find: vi.fn(async () => null),
    save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    create: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
  };
  return { service: new CatalogsService(records as never), records };
}

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

describe('CatalogsService', () => {
  it('does not seed catalogs outside production', async () => {
    process.env.NODE_ENV = 'test';
    const { service, records } = createService();

    await service.onModuleInit();

    expect(records.list).not.toHaveBeenCalled();
  });

  it('repairs missing or empty production catalogs and preserves populated ones', async () => {
    process.env.NODE_ENV = 'production';
    const { service, records } = createService();
    records.list.mockResolvedValue([
      { id: 'pitch-surfaces', values: ['Synthétique'] },
      { id: 'pitch-formats', values: [] },
    ]);
    records.find.mockImplementation(async (_collection: string, id: string) => id === 'pitch-formats' ? { id, values: [] } : null);

    await service.onModuleInit();

    expect(records.save).toHaveBeenCalled();
    expect(records.create).toHaveBeenCalled();
  });

  it('ignores duplicate catalog creation but rethrows other database errors', async () => {
    process.env.NODE_ENV = 'production';
    const { service, records } = createService();
    records.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.onModuleInit()).resolves.toBeUndefined();

    records.create.mockRejectedValue(new Error('database unavailable'));
    await expect(service.onModuleInit()).rejects.toThrow('database unavailable');
  });

  it('maps persisted catalog ids and filters invalid values', async () => {
    const { service, records } = createService();
    records.list.mockResolvedValue([
      { id: 'pitch-surfaces', values: [' Synthétique ', '', 42] },
      { id: 'marketplace-brands', values: null },
    ]);

    await expect(service.options()).resolves.toMatchObject({ pitchSurfaces: [' Synthétique '], marketplaceBrands: [] });
    await expect(service.values('pitchSurfaces')).resolves.toEqual([' Synthétique ']);
  });

  it('validates, deduplicates and sorts marketplace brands', async () => {
    const { service, records } = createService();
    records.find.mockResolvedValue({ id: 'marketplace-brands', values: ['Nike'] });

    await expect(service.addMarketplaceBrand(' nike ')).resolves.toBe('Nike');
    expect(records.save).not.toHaveBeenCalled();

    records.find.mockResolvedValue({ id: 'marketplace-brands', values: ['Puma'] });
    await expect(service.addMarketplaceBrand(' Adidas  Pro ')).resolves.toBe('Adidas Pro');
    expect(records.save).toHaveBeenCalledWith('catalogs', 'marketplace-brands', { id: 'marketplace-brands', values: ['Adidas Pro', 'Puma'] });

    await expect(service.addMarketplaceBrand('   ')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.addMarketplaceBrand('x'.repeat(81))).rejects.toBeInstanceOf(BadRequestException);
  });
});
