import { describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { UserContext } from '../auth/user-context.js';

describe('NotificationsService recipients', () => {
  it('only returns notifications belonging to the current user', async () => {
    const records = {
      list: vi.fn().mockResolvedValue([
        { id: 'mine', recipientId: 'user-1', createdAt: '2026-01-02' },
        { id: 'theirs', recipientId: 'user-2', createdAt: '2026-01-03' },
        { id: 'legacy', createdAt: '2026-01-04' },
      ]),
    };
    const context = new UserContext();
    const service = new NotificationsService(records as unknown as never, context);

    await expect(context.run('user-1', () => service.list())).resolves.toEqual([
      { id: 'mine', recipientId: 'user-1', createdAt: '2026-01-02' },
    ]);
  });

  it('assigns notifications to the authenticated user by default', async () => {
    const records = { create: vi.fn().mockResolvedValue(undefined) };
    const context = new UserContext();
    const service = new NotificationsService(records as unknown as never, context);

    const notification = await context.run('user-1', () => service.add({
      title: 'Test', message: 'Message', type: 'team', targetSection: 'teams',
    }));

    expect(notification.recipientId).toBe('user-1');
    expect(records.create).toHaveBeenCalledWith('notifications', notification.id, expect.objectContaining({ recipientId: 'user-1' }));
  });

  it('marks one notification and all current-user notifications as read', async () => {
    const records = {
      list: vi.fn().mockResolvedValue([
        { id: 'mine-1', recipientId: 'user-1', createdAt: '2026-01-02', isRead: false },
        { id: 'mine-2', recipientId: 'user-1', createdAt: '2026-01-01', isRead: false },
      ]),
      find: vi.fn().mockResolvedValue({ id: 'mine-1', recipientId: 'user-1', isRead: false }),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const context = new UserContext();
    const service = new NotificationsService(records as unknown as never, context);

    await context.run('user-1', () => service.markRead('mine-1'));
    await context.run('user-1', () => service.markAllRead());
    expect(records.save).toHaveBeenCalledWith('notifications', 'mine-1', expect.objectContaining({ isRead: true }));
    expect(records.save).toHaveBeenCalledWith('notifications', 'mine-2', expect.objectContaining({ isRead: true }));
  });
});
