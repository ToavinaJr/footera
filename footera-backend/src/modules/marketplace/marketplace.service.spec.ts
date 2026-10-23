import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MarketplaceService } from './marketplace.service.js';

const catalogOptions = {
  marketplaceCategories: ['Crampons', 'Maillots'],
  marketplaceConditions: ['Neuf avec étiquette', 'Très bon état'],
  marketplaceBrands: ['Nike', 'Adidas'],
  playerPositions: ['Gardien', 'Milieu Central'],
  recruitmentPositions: ['Gardien'],
  playerLevels: ['National'],
  strongFeet: ['Droitier'],
};

function makeService(profile: { activeRole: string; roles: string[] }) {
  const records = { create: vi.fn(async (_table: string, _id: string, item: unknown) => item), list: vi.fn() };
  const accounts = { profile: vi.fn(async () => profile) };
  const notifications = { add: vi.fn(async () => undefined) };
  const catalogs = {
    options: vi.fn(async () => catalogOptions),
    values: vi.fn(async (id: string) => catalogOptions[id as keyof typeof catalogOptions]),
  };
  return { service: new MarketplaceService(records as unknown as never, accounts as unknown as never, notifications as unknown as never, catalogs as unknown as never), records };
}

describe('MarketplaceService role and catalog validation', () => {
  const listing = {
    title: 'Chaussures', category: 'Crampons', price: 25,
    condition: 'Très bon état', brand: 'Nike', imageUrl: 'https://images.unsplash.com/photo-123',
  };

  it('allows listing when Vendeur is assigned, regardless of active mode', async () => {
    const { service, records } = makeService({ activeRole: 'Joueur', roles: ['Joueur', 'Vendeur'] });
    await service.create({ ...listing });
    expect(records.create).toHaveBeenCalledOnce();
  });

  it('rejects listing when the account does not have Vendeur assigned', async () => {
    const { service, records } = makeService({ activeRole: 'Vendeur', roles: ['Joueur'] });
    await expect(service.create({ ...listing })).rejects.toBeInstanceOf(ForbiddenException);
    expect(records.create).not.toHaveBeenCalled();
  });

  it('validates marketplace category, condition and brand against the catalog', async () => {
    const { service, records } = makeService({ activeRole: 'Vendeur', roles: ['Vendeur'] });
    await expect(service.categories()).resolves.toContain('Crampons');
    await expect(service.create({ ...listing, category: 'Not catalogued' })).rejects.toMatchObject({ status: 400 });
    await expect(service.create({ ...listing, condition: 'Damaged' })).rejects.toMatchObject({ status: 400 });
    await expect(service.create({ ...listing, brand: 'Unknown brand' })).rejects.toMatchObject({ status: 400 });
    expect(records.create).not.toHaveBeenCalled();
  });
});
