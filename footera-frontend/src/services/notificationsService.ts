import { apiClient } from '../lib/api/client';
import type { NotificationItem } from '../types';

export const notificationsService = {
  list(): Promise<NotificationItem[]> {
    return apiClient<NotificationItem[]>('notifications');
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient<void>(`notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient<void>('notifications/read-all', { method: 'POST' });
  },
};
