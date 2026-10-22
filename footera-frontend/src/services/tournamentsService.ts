import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Tournament } from '../types';

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
  async list(): Promise<Tournament[]> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getTournaments(), 200);
    }
    return apiClient<Tournament[]>('tournaments');
  },

  async getById(id: string): Promise<Tournament> {
    if (IS_MOCK_MODE) {
      const tourn = mockStorage.getTournamentById(id);
      if (!tourn) throw new Error('Tournoi introuvable');
      return mockDelay(tourn, 150);
    }
    return apiClient<Tournament>(`tournaments/${id}`);
  },

  async registerTeam(tournamentId: string, teamId: string): Promise<boolean> {
    if (IS_MOCK_MODE) {
      const ok = mockStorage.registerTeamForTournament(tournamentId, teamId);
      return mockDelay(ok, 300);
    }
    return apiClient<boolean>(`tournaments/${tournamentId}/register`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  },

  async create(input: CreateTournamentInput): Promise<Tournament> {
    if (IS_MOCK_MODE) {
      const created = mockStorage.createTournament(input);
      return mockDelay(created, 350);
    }
    return apiClient<Tournament>('tournaments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
