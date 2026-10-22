import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Match, LeagueStandingRow, ActivityFeedItem } from '../types';

export const matchesService = {
  async list(filterStatus?: 'ALL' | 'LIVE' | 'SCHEDULED' | 'FINISHED'): Promise<Match[]> {
    if (IS_MOCK_MODE) {
      let matches = mockStorage.getMatches();
      if (filterStatus && filterStatus !== 'ALL') {
        matches = matches.filter((m) => m.status === filterStatus);
      }
      return mockDelay(matches, 200);
    }
    const params = filterStatus && filterStatus !== 'ALL' ? `?status=${filterStatus}` : '';
    return apiClient<Match[]>(`matches${params}`);
  },

  async getById(id: string): Promise<Match> {
    if (IS_MOCK_MODE) {
      const match = mockStorage.getMatchById(id);
      if (!match) throw new Error('Match introuvable');
      return mockDelay(match, 150);
    }
    return apiClient<Match>(`matches/${id}`);
  },

  async toggleFollow(matchId: string): Promise<boolean> {
    if (IS_MOCK_MODE) {
      const isFav = mockStorage.toggleFavoriteMatch(matchId);
      return mockDelay(isFav, 100);
    }
    return apiClient<boolean>(`matches/${matchId}/follow`, { method: 'POST' });
  },

  async getLeagueStandings(): Promise<LeagueStandingRow[]> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getLeagueStandings(), 150);
    }
    return apiClient<LeagueStandingRow[]>('matches/standings');
  },

  async getActivityFeed(): Promise<ActivityFeedItem[]> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getActivityFeed(), 120);
    }
    return apiClient<ActivityFeedItem[]>('activity-feed');
  },
};
