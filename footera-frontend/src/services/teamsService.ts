import { apiClient } from '../lib/api/client';
import type { Club, Team, TeamDetail, TeamInvitation } from '../types';

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  userId: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  updatedAt: string;
}

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

  listPlayers(id: string, competitionId?: string): Promise<TeamDetail['members']> {
    const params = new URLSearchParams();
    if (competitionId) params.set('competitionId', competitionId);
    const query = params.size ? `?${params.toString()}` : '';
    return apiClient<TeamDetail['members']>(`teams/${encodeURIComponent(id)}/players${query}`);
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

  listMyJoinRequests(): Promise<TeamJoinRequest[]> {
    return apiClient<TeamJoinRequest[]>('teams/my-join-requests');
  },

  listMyTeamJoinRequests(): Promise<TeamJoinRequest[]> {
    return apiClient<TeamJoinRequest[]>('teams/my-team/join-requests');
  },

  respondToJoinRequest(requestId: string, accept: boolean): Promise<{ success: boolean; request: TeamJoinRequest }> {
    const action = accept ? 'accept' : 'decline';
    return apiClient<{ success: boolean; request: TeamJoinRequest }>(`teams/my-team/join-requests/${encodeURIComponent(requestId)}/${action}`, { method: 'POST' });
  },

  leaveCurrentTeam(): Promise<{ success: boolean; teamId: string; teamName: string }> {
    return apiClient<{ success: boolean; teamId: string; teamName: string }>('teams/my-team/membership', { method: 'DELETE' });
  },
};
