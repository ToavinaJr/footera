import { apiClient } from '../lib/api/client';
import type { Club, Team, TeamDetail, TeamInvitation } from '../types';

export const teamsService = {
  async list(filters?: { query?: string; category?: string; city?: string }): Promise<Team[]> {
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    if (filters?.category && filters.category !== 'Toutes') params.set('category', filters.category);
    if (filters?.city && filters.city !== 'Toutes') params.set('city', filters.city);
    return apiClient<Team[]>(`teams?${params.toString()}`);
  },

  getById(id: string): Promise<Team> {
    return apiClient<Team>(`teams/${encodeURIComponent(id)}`);
  },

  async getDetail(id: string, filters: { competitionId?: string; sortBy?: 'goals' | 'assists' | 'appearances' | 'yellowCards' | 'redCards' } = {}): Promise<TeamDetail> {
    const params = new URLSearchParams();
    if (filters.competitionId) params.set('competitionId', filters.competitionId);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    return apiClient<TeamDetail>(`teams/${encodeURIComponent(id)}/detail?${params.toString()}`);
  },

  async getMyTeam(): Promise<Team | null> {
    const response = await apiClient<{ team: Team | null }>('teams/my-team');
    return response.team;
  },

  listMyTeamInvitations(): Promise<TeamInvitation[]> {
    return apiClient<TeamInvitation[]>('teams/my-team/invitations');
  },

  listClubs(): Promise<Club[]> {
    return apiClient<Club[]>('clubs');
  },

  updateClubLogo(clubId: string, logoUrl: string): Promise<Club> {
    return apiClient<Club>(`clubs/${encodeURIComponent(clubId)}/logo`, { method: 'PATCH', body: JSON.stringify({ logoUrl }) });
  },

  joinTeam(teamId: string, message: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>(`teams/${encodeURIComponent(teamId)}/join`, { method: 'POST', body: JSON.stringify({ message }) });
  },
};
