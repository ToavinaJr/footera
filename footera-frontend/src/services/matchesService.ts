import { apiClient } from '../lib/api/client';
import type { ActivityFeedItem, LeagueStandingRow, Match } from '../types';

export const matchesService = {
  list(filterStatus?: 'ALL' | 'LIVE' | 'SCHEDULED' | 'FINISHED'): Promise<Match[]> {
    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== 'ALL') params.set('status', filterStatus);
    return apiClient<Match[]>(`matches${params.size ? `?${params.toString()}` : ''}`);
  },

  getById(id: string): Promise<Match> {
    return apiClient<Match>(`matches/${encodeURIComponent(id)}`);
  },

  toggleFollow(matchId: string): Promise<boolean> {
    return apiClient<boolean>(`matches/${encodeURIComponent(matchId)}/follow`, { method: 'POST' });
  },

  getLeagueStandings(): Promise<LeagueStandingRow[]> {
    return apiClient<LeagueStandingRow[]>('matches/standings');
  },

  getActivityFeed(): Promise<ActivityFeedItem[]> {
    return apiClient<ActivityFeedItem[]>('activity-feed');
  },
};
