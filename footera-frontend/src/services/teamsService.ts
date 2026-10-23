import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Team, TeamDetail, Club, TeamInvitation } from '../types';

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
    if (filters?.category && filters.category !== 'Toutes') params.set('category', filters.category);
    if (filters?.city && filters.city !== 'Toutes') params.set('city', filters.city);
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

  async getDetail(id: string, filters: { competitionId?: string; sortBy?: 'goals' | 'assists' | 'appearances' | 'yellowCards' | 'redCards' } = {}): Promise<TeamDetail> {
    const params = new URLSearchParams();
    if (filters.competitionId) params.set('competitionId', filters.competitionId);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    return apiClient<TeamDetail>(`teams/${encodeURIComponent(id)}/detail?${params.toString()}`);
  },

  async getMyTeam(): Promise<Team | undefined> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getMyTeam(), 120);
    }
    return apiClient<Team>('teams/my-team');
  },

  async listMyTeamInvitations(): Promise<TeamInvitation[]> {
    if (IS_MOCK_MODE) return mockDelay(mockStorage.getMyTeamInvitations(), 120);
    return apiClient<TeamInvitation[]>('teams/my-team/invitations');
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
