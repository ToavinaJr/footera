import { apiClient } from '../lib/api/client';
import type { UserProfile, UserRole } from '../types';

export const authService = {
  getProfile(): Promise<UserProfile> {
    return apiClient<UserProfile>('auth/me');
  },

  async login(credentials: { email: string; password: string }): Promise<UserProfile> {
    const result = await apiClient<{ user: UserProfile }>('auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    return result.user;
  },

  async register(input: { name: string; email: string; password: string }): Promise<UserProfile> {
    const result = await apiClient<{ user: UserProfile }>('auth/register', { method: 'POST', body: JSON.stringify(input) });
    return result.user;
  },

  async logout(): Promise<void> {
    await apiClient<{ success: boolean }>('auth/logout', { method: 'POST' });
  },

  updateProfile(partial: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient<UserProfile>('auth/profile', { method: 'PUT', body: JSON.stringify(partial) });
  },

  updateSportsCv(sportsCv: Partial<UserProfile['sportsCv']>): Promise<UserProfile> {
    return apiClient<UserProfile>('auth/sports-cv', { method: 'PUT', body: JSON.stringify(sportsCv) });
  },

  switchRole(role: UserRole): Promise<UserProfile> {
    return apiClient<UserProfile>('auth/role', { method: 'POST', body: JSON.stringify({ role }) });
  },

  async toggleFavoriteTeam(teamId: string): Promise<boolean> {
    const result = await apiClient<{ isFavorite: boolean }>(`teams/${encodeURIComponent(teamId)}/favorite`, { method: 'POST' });
    return result.isFavorite;
  },

  async resetDemoData(): Promise<void> {
    await apiClient<{ success: boolean }>('auth/reset-demo', { method: 'POST' });
  },
};
