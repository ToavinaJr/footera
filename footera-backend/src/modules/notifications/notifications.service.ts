import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RecordRepository } from '../../database/record.repository.js';
import { UserContext } from '../auth/user-context.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly records: RecordRepository, private readonly userContext: UserContext) {}

  async list() {
    const userId = this.userContext.userId;
    if (!userId) return [];
    const records: any[] = await this.records.list('notifications');
    return records.filter((notification) => notification.recipientId === userId)
      .sort((a, b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)));
  }

  async markRead(id: string) {
    const userId = this.userContext.userId;
    if (!userId) return;
    const item = await this.records.find<any>('notifications', id);
    if (item && item.recipientId === userId) {
      await this.records.save('notifications', id, { ...item, isRead: true });
    }
  }

  async markAllRead() {
    const items = await this.list();
    await Promise.all(items.map((item: any) => this.records.save('notifications', item.id, { ...item, isRead: true })));
  }

  async add(item: {
    title: string;
    message: string;
    type: string;
    targetSection: string;
    targetId?: string;
    recipientId?: string;
    invitationId?: string;
    invitationStatus?: string;
  }) {
    if (!this.userContext.userId) throw new UnauthorizedException('Connectez-vous pour créer une notification.');
    const recipientId = item.recipientId ?? this.userContext.userId;
    if (!recipientId) throw new UnauthorizedException('Une notification doit être liée à un utilisateur.');
    const notification = {
      ...item,
      recipientId,
      id: `notif_${randomUUID()}`,
      time: 'À l’instant',
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    await this.records.create('notifications', notification.id, notification);
    return notification;
  }
}
