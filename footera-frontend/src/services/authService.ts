import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { UserProfile, UserRole } from '../types';

export const authService = {
  async getProfile(): Promise<UserProfile> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getProfile(), 100);
    }
    return apiClient<UserProfile>('auth/me');
  },

  async login(credentials: { email: string; password: string }): Promise<UserProfile> {
    if (IS_MOCK_MODE) return mockDelay(mockStorage.getProfile(), 100);
    const result = await apiClient<{ user: UserProfile }>('auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    return result.user;
  },

  async register(input: { name: string; email: string; password: string }): Promise<UserProfile> {
    if (IS_MOCK_MODE) return mockDelay(mockStorage.getProfile(), 100);
    const result = await apiClient<{ user: UserProfile }>('auth/register', { method: 'POST', body: JSON.stringify(input) });
    return result.user;
  },

  async logout(): Promise<void> {
    if (!IS_MOCK_MODE) await apiClient<{ success: boolean }>('auth/logout', { method: 'POST' });
  },

  async updateProfile(partial: Partial<UserProfile>): Promise<UserProfile> {
    if (IS_MOCK_MODE) {
      const updated = mockStorage.updateProfile(partial);
      return mockDelay(updated, 250);
    }
    return apiClient<UserProfile>('auth/profile', {
      method: 'PUT',
      body: JSON.stringify(partial),
    });
  },

  async updateSportsCv(sportsCv: Partial<UserProfile['sportsCv']>): Promise<UserProfile> {
    if (IS_MOCK_MODE) {
      const updated = mockStorage.updateSportsCv(sportsCv);
      return mockDelay(updated, 250);
    }
    return apiClient<UserProfile>('auth/sports-cv', {
      method: 'PUT',
      body: JSON.stringify(sportsCv),
    });
  },

  async switchRole(role: UserRole): Promise<UserProfile> {
    if (IS_MOCK_MODE) {
      const updated = mockStorage.setActiveRole(role);
      return mockDelay(updated, 150);
    }
    return apiClient<UserProfile>('auth/role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  async toggleFavoriteTeam(teamId: string): Promise<boolean> {
    if (IS_MOCK_MODE) {
      const res = mockStorage.toggleFavoriteTeam(teamId);
      return mockDelay(res, 80);
    }
    return apiClient<boolean>(`teams/${teamId}/favorite`, { method: 'POST' });
  },

  async resetDemoData(): Promise<void> {
    if (IS_MOCK_MODE) {
      mockStorage.resetAllData();
      return mockDelay(undefined, 200);
    }
    await apiClient<{ success: boolean }>('auth/reset-demo', { method: 'POST' });
  },
};
