import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Team, Club } from '../types';

export const teamsService = {
  async list(filters?: { query?: string; category?: string; city?: string }): Promise<Team[]> {
    if (IS_MOCK_MODE) {
      let teams = mockStorage.getTeams();
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        teams = teams.filter((t) => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q));
      }
      if (filters?.category && filters.category !== 'Toutes') {
        teams = teams.filter((t) => t.category === filters.category);
      }
      return mockDelay(teams, 200);
    }
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    return apiClient<Team[]>(`teams?${params.toString()}`);
  },

  async getById(id: string): Promise<Team> {
    if (IS_MOCK_MODE) {
      const team = mockStorage.getTeamById(id);
      if (!team) throw new Error('Équipe introuvable');
      return mockDelay(team, 150);
    }
    return apiClient<Team>(`teams/${id}`);
  },

  async getMyTeam(): Promise<Team | undefined> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getMyTeam(), 120);
    }
    return apiClient<Team>('teams/my-team');
  },

  async listClubs(): Promise<Club[]> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getClubs(), 200);
    }
    return apiClient<Club[]>('clubs');
  },

  async updateClubLogo(clubId: string, logoUrl: string): Promise<Club> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.updateClubLogo(clubId, logoUrl), 250);
    }
    return apiClient<Club>(`clubs/${encodeURIComponent(clubId)}/logo`, {
      method: 'PATCH',
      body: JSON.stringify({ logoUrl }),
    });
  },

  async joinTeam(teamId: string, message: string): Promise<{ success: boolean; message: string }> {
    if (IS_MOCK_MODE) {
      const res = mockStorage.joinTeam(teamId, message);
      return mockDelay(res, 350);
    }
    return apiClient<{ success: boolean; message: string }>(`teams/${teamId}/join`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};
