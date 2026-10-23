import { apiClient } from '../lib/api/client';
import type { Tournament } from '../types';

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

  registerTeam(tournamentId: string, teamId: string): Promise<boolean> {
    return apiClient<boolean>(`tournaments/${encodeURIComponent(tournamentId)}/register`, { method: 'POST', body: JSON.stringify({ teamId }) });
  },

  create(input: CreateTournamentInput): Promise<Tournament> {
    return apiClient<Tournament>('tournaments', { method: 'POST', body: JSON.stringify(input) });
  },
};
