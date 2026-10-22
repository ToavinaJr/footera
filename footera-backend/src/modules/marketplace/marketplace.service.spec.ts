import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MarketplaceService } from './marketplace.service.js';

function makeService(profile: { activeRole: string; roles: string[] }) {
  const records = { create: vi.fn(async (_table: string, _id: string, item: unknown) => item), list: vi.fn() };
  const accounts = { profile: vi.fn(async () => profile) };
  const notifications = { add: vi.fn(async () => undefined) };
  return { service: new MarketplaceService(records as any, accounts as any, notifications as any), records };
}

describe('MarketplaceService role permissions', () => {
  const listing = { title: 'Chaussures', category: 'Crampons', price: 25, imageUrl: 'https://images.unsplash.com/photo-123' };

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

  it('exposes the categories from the backend catalog and rejects unknown categories', async () => {
    const { service, records } = makeService({ activeRole: 'Vendeur', roles: ['Vendeur'] });
    expect(service.categories()).toContain('Crampons');
    await expect(service.create({ ...listing, category: 'Non cataloguée' })).rejects.toMatchObject({ status: 400 });
    expect(records.create).not.toHaveBeenCalled();
  });
});
