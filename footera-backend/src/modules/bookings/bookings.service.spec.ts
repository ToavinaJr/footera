import { ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BookingsService } from './bookings.service.js';

const catalogOptions = {
  pitchSurfaces: ['Indoor Five', 'Synthétique dernière génération'],
  pitchAmenities: ['Lighting'],
};

function makeService(profile: { activeRole: string; roles: string[] }) {
  const records = { create: vi.fn(async (_table: string, _id: string, pitch: unknown) => pitch) };
  const accounts = { profile: vi.fn(async () => profile) };
  const notifications = { add: vi.fn(async () => undefined) };
  const catalogs = {
    options: vi.fn(async () => catalogOptions),
    values: vi.fn(async (key: keyof typeof catalogOptions) => catalogOptions[key]),
  };
  return { service: new BookingsService(records as any, accounts as any, notifications as any, catalogs as any), records };
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

  it('exposes surface and amenity options from the database catalog', async () => {
    const { service } = makeService({ activeRole: 'Joueur', roles: ['Joueur'] });
    await expect(service.getPitchOptions()).resolves.toEqual({ surfaces: catalogOptions.pitchSurfaces, amenities: catalogOptions.pitchAmenities });
  });
});

describe('BookingsService bookings and ratings', () => {
  const pitchRecord: any = {
    id: 'pitch-test', name: 'Terrain test', complexName: 'Complexe test', surface: 'Indoor Five',
    rating: 4.8, reviewsCount: 2,
    availableSlots: [
      { id: 's1', time: '09:00 - 10:30', price: 50, isAvailable: true },
      { id: 's2', time: '18:00 - 19:30', price: 65, isAvailable: true },
    ],
  };

  function makeBookingService() {
    let pitch = structuredClone(pitchRecord);
    const created: any[] = [];
    const records = {
      find: vi.fn(async (collection: string, id: string) => collection === 'pitches' && id === pitch.id ? pitch : null),
      list: vi.fn(async (collection: string) => collection === 'bookings' ? created : []),
      create: vi.fn(async (_collection: string, _id: string, payload: any) => { created.push(payload); return payload; }),
      save: vi.fn(async (_collection: string, _id: string, payload: any) => { pitch = payload; return payload; }),
    };
    const accounts = { profile: vi.fn(async () => ({ id: 'user-1', name: 'Alex', roles: ['Joueur'], sportsCv: {} })) };
    const notifications = { add: vi.fn(async () => undefined) };
    const catalogs = { options: vi.fn(async () => ({})), values: vi.fn(async () => []) };
    return { service: new BookingsService(records as any, accounts as any, notifications as any, catalogs as any), records, created, getPitch: () => pitch };
  }

  it('quotes selected slot prices from backend data rather than client-supplied prices', async () => {
    const { service } = makeBookingService();
    await expect(service.quoteBookings({
      pitchId: 'pitch-test',
      selections: [{ date: '2026-10-24', time: '09:00 - 10:30' }, { date: '2026-10-25', time: '18:00 - 19:30' }],
    })).resolves.toEqual({ total: 115, perDate: { '2026-10-24': 50, '2026-10-25': 65 } });
  });

  it('rejects duplicate or already reserved selections before creating any booking', async () => {
    const { service, created } = makeBookingService();
    await expect(service.createBookings({
      pitchId: 'pitch-test',
      selections: [{ date: '2026-10-24', time: '09:00 - 10:30' }, { date: '2026-10-24', time: '09:00 - 10:30' }],
    })).rejects.toBeInstanceOf(ConflictException);
    expect(created).toHaveLength(0);
  });

  it('creates bookings using the current backend slot price', async () => {
    const { service } = makeBookingService();
    const created = await service.createBookings({
      pitchId: 'pitch-test', selections: [{ date: '2026-10-24', time: '18:00 - 19:30' }],
    });
    expect(created[0].totalPrice).toBe(65);
  });

  it('persists one review per user and recalculates the public aggregate', async () => {
    const { service, records, getPitch } = makeBookingService();
    await service.ratePitch('pitch-test', { rating: 4, comment: 'Très bien' });
    const updated = await service.ratePitch('pitch-test', { rating: 2, comment: 'Après visite' });
    expect(records.save).toHaveBeenCalledTimes(2);
    expect(getPitch().reviews).toHaveLength(1);
    expect(updated.reviewsCount).toBe(3);
    expect(updated.rating).toBe(3.87);
    expect(updated.myRating).toBe(2);
    await expect(service.getPitch('pitch-test')).resolves.toMatchObject({ myRating: 2, myReview: { comment: 'Après visite' } });
  });
});
