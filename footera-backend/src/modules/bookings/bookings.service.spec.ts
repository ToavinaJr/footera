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
  return { service: new BookingsService(records as unknown as never, accounts as unknown as never, notifications as unknown as never, catalogs as unknown as never), records };
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
  const pitchRecord = {
    id: 'pitch-test', name: 'Terrain test', complexName: 'Complexe test', surface: 'Indoor Five',
    rating: 4.8, reviewsCount: 2,
    reviews: [
      { userId: 'user-2', rating: 5, comment: '', createdAt: '2026-01-01T00:00:00.000Z' },
      { userId: 'user-3', rating: 4, comment: '', createdAt: '2026-01-01T00:00:00.000Z' },
    ],
    availableSlots: [
      { id: 's1', time: '09:00 - 10:30', price: 50, isAvailable: true },
      { id: 's2', time: '18:00 - 19:30', price: 65, isAvailable: true },
    ],
  };

  function makeBookingService() {
    let pitch = structuredClone(pitchRecord);
    const created: unknown[] = [];
    const records = {
      find: vi.fn(async (collection: string, id: string) => collection === 'pitches' && id === pitch.id ? pitch : null),
      list: vi.fn(async (collection: string) => collection === 'bookings' ? created : []),
      create: vi.fn(async (_collection: string, _id: string, payload: unknown) => { created.push(payload); return payload; }),
      reserveBookingsAtomically: vi.fn(async (entries: Array<{ payload: unknown }>) => { created.push(...entries.map((entry) => entry.payload)); return true; }),
      cancelBookingAndReleaseSlot: vi.fn(async (id: string, payload: unknown) => {
        const index = created.findIndex((booking) => (booking as { id: string }).id === id);
        if (index >= 0) created[index] = payload;
      }),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => { pitch = payload; return payload; }),
    };
    const accounts = { profile: vi.fn(async () => ({ id: 'user-1', name: 'Alex', roles: ['Joueur'], sportsCv: {} })) };
    const notifications = { add: vi.fn(async () => undefined) };
    const catalogs = { options: vi.fn(async () => ({})), values: vi.fn(async () => []) };
    return { service: new BookingsService(records as unknown as never, accounts as unknown as never, notifications as unknown as never, catalogs as unknown as never), records, created, getPitch: () => pitch };
  }

  it('quotes selected slot prices from backend data rather than client-supplied prices', async () => {
    const { service } = makeBookingService();
    await expect(service.quoteBookings({
      pitchId: 'pitch-test',
      selections: [{ date: '2026-10-24', time: '09:00 - 10:30' }, { date: '2026-10-25', time: '18:00 - 19:30' }],
    })).resolves.toEqual({ total: 115, perDate: { '2026-10-24': 50, '2026-10-25': 65 } });
  });

  it('rejects duplicate or already reserved selections before creating bookings', async () => {
    const { service, created } = makeBookingService();
    await expect(service.createBookings({
      pitchId: 'pitch-test',
      selections: [{ date: '2026-10-24', time: '09:00 - 10:30' }, { date: '2026-10-24', time: '09:00 - 10:30' }],
    })).rejects.toBeInstanceOf(ConflictException);
    expect(created).toHaveLength(0);
  });

  it('creates bookings using the current backend slot price', async () => {
    const { service, records } = makeBookingService();
    const created = await service.createBookings({
      pitchId: 'pitch-test', selections: [{ date: '2026-10-24', time: '18:00 - 19:30' }],
    });
    expect(created[0].totalPrice).toBe(65);
    expect(records.reserveBookingsAtomically).toHaveBeenCalledWith([
      expect.objectContaining({ pitchId: 'pitch-test', dateKey: '2026-10-24', time: '18:00 - 19:30' }),
    ]);
  });

  it('rejects a concurrent slot claim and does not report a false success', async () => {
    const { service, records, created } = makeBookingService();
    records.reserveBookingsAtomically.mockResolvedValue(false);

    await expect(service.createBookings({
      pitchId: 'pitch-test', selections: [{ date: '2026-10-24', time: '18:00 - 19:30' }],
    })).rejects.toBeInstanceOf(ConflictException);
    expect(created).toHaveLength(0);
  });

  it('persists a multi-slot booking batch atomically', async () => {
    const { service, records } = makeBookingService();
    await service.createBookings({
      pitchId: 'pitch-test', selections: [
        { date: '2026-10-24', time: '09:00 - 10:30' },
        { date: '2026-10-25', time: '18:00 - 19:30' },
      ],
    });
    expect(records.reserveBookingsAtomically).toHaveBeenCalledOnce();
    expect(records.reserveBookingsAtomically.mock.calls[0][0]).toHaveLength(2);
  });

  it('persists one review per user and recalculates the public aggregate', async () => {
    const { service, records, getPitch } = makeBookingService();
    await service.ratePitch('pitch-test', { rating: 4, comment: 'Très bien' });
    const updated = await service.ratePitch('pitch-test', { rating: 2, comment: 'Après visite' });
    expect(records.save).toHaveBeenCalledTimes(2);
    expect(getPitch().reviews).toHaveLength(3);
    expect(updated.reviewsCount).toBe(3);
    expect(updated.rating).toBe(3.67);
    expect(updated.myRating).toBe(2);
    await expect(service.getPitch('pitch-test')).resolves.toMatchObject({ myRating: 2, myReview: { comment: 'Après visite' } });
  });

  it('does not include seed aggregate ratings without real reviews', async () => {
    const { service, records } = makeBookingService();
    records.find.mockResolvedValue({ ...pitchRecord, reviews: [] } as unknown as never);
    // The persisted legacy aggregate is ignored; only review records determine the score.
    await expect(service.getPitch('pitch-test')).resolves.toMatchObject({ rating: 0, reviewsCount: 0, reviews: [] });
  });

  it('lists only bookings owned by the authenticated account and prevents cross-account cancellation', async () => {
    const { service, records, created } = makeBookingService();
    created.push(
      { id: 'mine', userId: 'user-1', createdAt: '2026-10-20T00:00:00.000Z', status: 'CONFIRMED' },
      { id: 'other', userId: 'user-2', createdAt: '2026-10-21T00:00:00.000Z', status: 'CONFIRMED' },
    );
    await expect(service.listBookings()).resolves.toEqual([expect.objectContaining({ id: 'mine' })]);
    records.find.mockImplementation(async (collection: string, id: string) => collection === 'bookings' ? created.find((booking) => booking.id === id) : null);
    await expect(service.cancelBooking('other')).resolves.toBe(false);
  });

  it('updates cancellation and releases its slot claim through the atomic repository operation', async () => {
    const { service, records, created } = makeBookingService();
    const booking = {
      id: 'mine', userId: 'user-1', pitchId: 'pitch-test', date: '2026-10-24', time: '09:00 - 10:30',
      status: 'CONFIRMED', createdAt: '2026-10-20T00:00:00.000Z',
    };
    created.push(booking);
    records.find.mockImplementation(async (collection: string, id: string) => {
      if (collection === 'bookings') return created.find((item) => (item as { id: string }).id === id) ?? null;
      return null;
    });

    await expect(service.cancelBooking('mine')).resolves.toBe(true);

    expect(records.cancelBookingAndReleaseSlot).toHaveBeenCalledWith('mine', expect.objectContaining({ status: 'CANCELLED' }));
  });
});
