import { apiClient } from '../lib/api/client';
import type { UserProfile } from '../types';
export interface AccountSession { id: string; expiresAt: string; current: boolean }
export const settingsService = {
  preferences: (preferences: NonNullable<UserProfile['preferences']>) => apiClient<UserProfile>('auth/preferences', { method: 'PUT', body: JSON.stringify(preferences) }),
  sessions: () => apiClient<AccountSession[]>('auth/sessions'),
  revokeSession: (id: string) => apiClient(`auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  changePassword: (currentPassword: string, newPassword: string) => apiClient('auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
};
