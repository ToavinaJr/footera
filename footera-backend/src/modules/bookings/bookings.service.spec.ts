import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BookingsService } from './bookings.service.js';

function makeService(profile: { activeRole: string; roles: string[] }) {
  const records = { create: vi.fn(async (_table: string, _id: string, pitch: unknown) => pitch) };
  const accounts = { profile: vi.fn(async () => profile) };
  const notifications = { add: vi.fn(async () => undefined) };
  return { service: new BookingsService(records as any, accounts as any, notifications as any), records };
}

describe('BookingsService pitch permissions', () => {
  const pitch = {
    name: 'Terrain test', complexName: 'Complexe test', city: 'Antananarivo', address: 'Centre',
    surface: 'Synthétique dernière génération', dimensions: '5v5', imageUrl: 'https://images.unsplash.com/photo-123', hourlyRate: 50, amenities: [],
  };

  it('allows pitch creation when Gestionnaire Terrain is assigned, regardless of active mode', async () => {
    const { service, records } = makeService({ activeRole: 'Joueur', roles: ['Joueur', 'Gestionnaire Terrain'] });
    await service.createPitch({ ...pitch });
    expect(records.create).toHaveBeenCalledOnce();
  });

  it('rejects pitch creation when the account does not have Gestionnaire Terrain assigned', async () => {
    const { service, records } = makeService({ activeRole: 'Gestionnaire Terrain', roles: ['Joueur'] });
    await expect(service.createPitch({ ...pitch })).rejects.toBeInstanceOf(ForbiddenException);
    expect(records.create).not.toHaveBeenCalled();
  });

  it('exposes backend-managed surface and amenity options', () => {
    const { service } = makeService({ activeRole: 'Joueur', roles: ['Joueur'] });
    expect(service.getPitchOptions().surfaces).toContain('Indoor Five');
    expect(service.getPitchOptions().amenities).toContain('Éclairage nocturne LED');
  });
});
