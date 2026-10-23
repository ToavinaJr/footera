import { apiClient } from '../lib/api/client';
import type { Position, TopAssisterItem, TopScorerItem, TeamStatsItem, PlayerStatsItem } from '../types';

function buildQuery(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value?.trim() && value !== 'all' && value !== 'Tous') params.set(key, value.trim());
  }
  return params.toString();
}

export const statsService = {
  getTopScorers(filters?: { tournamentId?: string; teamId?: string; limit?: number }): Promise<TopScorerItem[]> {
    const query = buildQuery({
      tournamentId: filters?.tournamentId,
      teamId: filters?.teamId,
      limit: filters?.limit === undefined ? undefined : String(filters.limit),
    });
    return apiClient<TopScorerItem[]>(`stats/top-scorers${query ? `?${query}` : ''}`);
  },

  getTopAssisters(filters?: { tournamentId?: string; teamId?: string; limit?: number }): Promise<TopAssisterItem[]> {
    const query = buildQuery({
      tournamentId: filters?.tournamentId,
      teamId: filters?.teamId,
      limit: filters?.limit === undefined ? undefined : String(filters.limit),
    });
    return apiClient<TopAssisterItem[]>(`stats/top-assisters${query ? `?${query}` : ''}`);
  },

  getTeamsStats(filters?: { tournamentId?: string }): Promise<TeamStatsItem[]> {
    const query = buildQuery({ tournamentId: filters?.tournamentId });
    return apiClient<TeamStatsItem[]>(`stats/teams${query ? `?${query}` : ''}`);
  },

  getPlayersStats(filters?: { teamId?: string; position?: Position | 'Tous'; searchQuery?: string }): Promise<PlayerStatsItem[]> {
    const query = buildQuery({
      teamId: filters?.teamId,
      position: filters?.position,
      searchQuery: filters?.searchQuery,
    });
    return apiClient<PlayerStatsItem[]>(`stats/players${query ? `?${query}` : ''}`);
  },
};
