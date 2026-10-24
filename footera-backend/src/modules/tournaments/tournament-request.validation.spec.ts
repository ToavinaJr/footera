import { describe, expect, it } from 'vitest';
import { createTournamentBodyPipe, registerTournamentTeamBodyPipe } from './tournament-request.validation.js';

const validTournament = {
  title: 'Tournoi Footera',
  format: '5v5 (Five)',
  city: 'Antananarivo',
  venue: 'Footera Arena',
  startDate: '2026-11-01',
  endDate: '2026-11-03',
  maxTeams: 16,
  entryFee: 0,
  prizePool: 1_000_000,
  bannerUrl: 'https://images.unsplash.com/photo-123?auto=format',
  organizer: 'Organisateur Footera',
};

describe('tournament request validation', () => {
  it('accepts valid tournament creation and team registration payloads', () => {
    expect(createTournamentBodyPipe.transform(validTournament)).toEqual(validTournament);
    expect(registerTournamentTeamBodyPipe.transform({ teamId: 'team-1' })).toEqual({ teamId: 'team-1' });
  });

  it('rejects invalid dates, reversed ranges, untrusted images, and extra properties', () => {
    expect(() => createTournamentBodyPipe.transform({ ...validTournament, startDate: '2026-02-30' })).toThrow();
    expect(() => createTournamentBodyPipe.transform({ ...validTournament, startDate: '2026-11-03', endDate: '2026-11-01' })).toThrow();
    expect(() => createTournamentBodyPipe.transform({ ...validTournament, bannerUrl: 'javascript:alert(1)' })).toThrow();
    expect(() => createTournamentBodyPipe.transform({ ...validTournament, organizerId: 'other-user' })).toThrow();
    expect(() => registerTournamentTeamBodyPipe.transform({ teamId: 'team-1', ownerId: 'attacker' })).toThrow();
  });
});
