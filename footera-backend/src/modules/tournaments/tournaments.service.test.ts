import { describe, expect, it, vi } from 'vitest';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { TournamentsService } from './tournaments.service.js';

describe('TournamentsService registration', () => {
  it('lists only registered teams and pitches referenced by tournament matches', async () => {
    const records = {
      find: vi.fn().mockResolvedValue({ id: 'cup', participantTeamIds: ['team-1'] }),
      list: vi.fn(async (collection: string) => ({
        teams: [{ id: 'team-1', name: 'Registered', ownerId: 'private-owner' }, { id: 'team-2', name: 'Other' }],
        matches: [{ id: 'match-1', tournamentId: 'cup', pitchId: 'pitch-1' }, { id: 'match-2', tournamentId: 'cup', pitchId: 'missing' }],
        pitches: [{ id: 'pitch-1', name: 'Pitch One' }, { id: 'pitch-2', name: 'Unrelated Pitch' }],
      }[collection] ?? [])),
    };
    const service = new TournamentsService(records as unknown as never, { add: vi.fn() } as unknown as never, { userId: null } as unknown as never, { values: vi.fn(async (key: string) => key === 'tournamentFormats' ? ['7v7'] : ['8']) } as unknown as never);

    await expect(service.listParticipatingTeams('cup')).resolves.toEqual([{ id: 'team-1', name: 'Registered' }]);
    await expect(service.listPitches('cup')).resolves.toEqual([{ id: 'pitch-1', name: 'Pitch One' }]);
  });

  it('rejects registration once a tournament has started', async () => {
    const records = {
      find: vi.fn().mockResolvedValue({ id: 'cup', status: 'EN_COURS', participantTeamIds: [], maxTeams: 8 }),
      list: vi.fn((collection: string) => Promise.resolve(collection === 'teams' ? [] : [])),
      save: vi.fn(),
    };
    const service = new TournamentsService(records as unknown as never, { add: vi.fn() } as unknown as never, { userId: 'organizer-1' } as unknown as never, { values: vi.fn(async (key: string) => key === 'tournamentFormats' ? ['7v7'] : ['8']) } as unknown as never);

    await expect(service.register('cup', 'team-1')).rejects.toBeInstanceOf(ConflictException);
    expect(records.save).not.toHaveBeenCalled();
  });

  it('rejects registering a team managed by another account', async () => {
    const tournament = { id: 'cup', status: 'INSCRIPTIONS_OUVERTES', startDate: '2026-11-01', participantTeamIds: [], maxTeams: 8 };
    const team = { id: 'team-1', ownerId: 'owner-1', managerIds: [] };
    const records = {
      find: vi.fn(async (collection: string) => collection === 'tournaments' ? tournament : team),
      list: vi.fn(async () => []),
      save: vi.fn(),
    };
    const service = new TournamentsService(records as unknown as never, { add: vi.fn() } as unknown as never, { userId: 'attacker-1' } as unknown as never, { values: vi.fn(async (key: string) => key === 'tournamentFormats' ? ['7v7'] : ['8']) } as unknown as never);

    await expect(service.register('cup', 'team-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(records.save).not.toHaveBeenCalled();
  });

  it('allows a team owner to register their own team', async () => {
    const tournament = { id: 'cup', status: 'INSCRIPTIONS_OUVERTES', startDate: '2026-11-01', participantTeamIds: [], maxTeams: 8 };
    const team = { id: 'team-1', ownerId: 'owner-1', managerIds: [], name: 'FC Test' };
    const records = {
      find: vi.fn(async (collection: string) => collection === 'tournaments' ? tournament : team),
      list: vi.fn(async () => []),
      save: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const service = new TournamentsService(records as unknown as never, { add: vi.fn() } as unknown as never, { userId: 'owner-1' } as unknown as never, { values: vi.fn(async (key: string) => key === 'tournamentFormats' ? ['7v7'] : ['8']) } as unknown as never);

    await expect(service.register('cup', 'team-1')).resolves.toBe(true);
    expect(records.save).toHaveBeenCalledWith('tournaments', 'cup', expect.objectContaining({ participantTeamIds: ['team-1'] }));
  });

  it('binds a newly created tournament to the authenticated organizer', async () => {
    const records = {
      find: vi.fn(async () => ({ id: 'organizer-1', name: 'Compte organisateur', roles: ['Organisateur Tournoi'] })),
      list: vi.fn(async () => [{ id: 'pitch-owned', ownerId: 'organizer-1', name: 'Terrain central', complexName: 'Complexe Footera', city: 'Fianarantsoa' }]),
      create: vi.fn(async (_collection: string, _id: string, payload: unknown) => payload),
    };
    const notifications = { add: vi.fn(async () => undefined) };
    const service = new TournamentsService(records as unknown as never, notifications as unknown as never, { userId: 'organizer-1' } as unknown as never, { values: vi.fn(async (key: string) => key === 'tournamentFormats' ? ['7v7'] : ['8']) } as unknown as never);

    const created = await service.create({
      pitchIds: ['pitch-owned'],
      title: 'Coupe test', format: '7v7', city: 'Antananarivo', venue: 'Terrain central',
      startDate: '2026-11-01', endDate: '2026-11-02', maxTeams: 8, entryFee: 0, prizePool: 0,
      bannerUrl: '', organizer: 'Organisateur affiché',
    });

    expect(records.create).toHaveBeenCalledWith('tournaments', created.id, expect.objectContaining({ organizerId: 'organizer-1' }));
    expect(created.organizer).toBe('Compte organisateur');
    expect(records.create).toHaveBeenCalledWith('tournaments', created.id, expect.objectContaining({ city: 'Fianarantsoa', venue: 'Complexe Footera', pitchIds: ['pitch-owned'] }));
  });

  it('rejects tournament creation for accounts without the organizer role', async () => {
    const records = {
      find: vi.fn(async () => ({ id: 'player-1', name: 'Joueur', roles: ['Joueur'] })),
      create: vi.fn(),
    };
    const service = new TournamentsService(records as unknown as never, { add: vi.fn() } as unknown as never, { userId: 'player-1' } as unknown as never, { values: vi.fn(async (key: string) => key === 'tournamentFormats' ? ['7v7'] : ['8']) } as unknown as never);

    await expect(service.create({
      pitchIds: ['pitch-owned'],
      title: 'Coupe test', format: '7v7', city: 'Antananarivo', venue: 'Terrain central',
      startDate: '2026-11-01', endDate: '2026-11-02', maxTeams: 8, entryFee: 0, prizePool: 0,
      bannerUrl: '', organizer: 'Organisateur spoofé',
    })).rejects.toMatchObject({ status: 403 });
    expect(records.create).not.toHaveBeenCalled();
  });
});
