import { apiClient } from '../lib/api/client';
import type { Team, Tournament, TournamentStadium } from '../types';

export interface CreateTournamentInput {
  title: string;
  format: Tournament['format'];
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  bannerUrl: string;
  organizer: string;
}

export const tournamentsService = {
  list(): Promise<Tournament[]> {
    return apiClient<Tournament[]>('tournaments');
  },

  getById(id: string): Promise<Tournament> {
    return apiClient<Tournament>(`tournaments/${encodeURIComponent(id)}`);
  },

  listParticipatingTeams(id: string): Promise<Team[]> {
    return apiClient<Team[]>(`tournaments/${encodeURIComponent(id)}/teams`);
  },

  listPitches(id: string): Promise<TournamentStadium[]> {
    return apiClient<Array<{ id: string; name: string; complexName: string; city: string; address?: string }>>(`tournaments/${encodeURIComponent(id)}/pitches`)
      .then((pitches) => pitches.map((pitch) => ({
        id: pitch.id,
        name: pitch.complexName || pitch.name,
        pitchId: pitch.id,
        city: pitch.city,
        address: pitch.address,
      })));
  },

  registerTeam(tournamentId: string, teamId: string): Promise<boolean> {
    return apiClient<boolean>(`tournaments/${encodeURIComponent(tournamentId)}/register`, { method: 'POST', body: JSON.stringify({ teamId }) });
  },

  create(input: CreateTournamentInput): Promise<Tournament> {
    return apiClient<Tournament>('tournaments', { method: 'POST', body: JSON.stringify(input) });
  },
};
