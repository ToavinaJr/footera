import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { NotificationItem } from '../types';

export const notificationsService = {
  async list(): Promise<NotificationItem[]> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getNotifications(), 150);
    }
    return apiClient<NotificationItem[]>('notifications');
  },

  async markAsRead(id: string): Promise<void> {
    if (IS_MOCK_MODE) {
      mockStorage.markNotificationRead(id);
      return mockDelay(undefined, 50);
    }
    return apiClient<void>(`notifications/${id}/read`, { method: 'POST' });
  },

  async markAllAsRead(): Promise<void> {
    if (IS_MOCK_MODE) {
      mockStorage.markAllNotificationsRead();
      return mockDelay(undefined, 80);
    }
    return apiClient<void>('notifications/read-all', { method: 'POST' });
  },
};
