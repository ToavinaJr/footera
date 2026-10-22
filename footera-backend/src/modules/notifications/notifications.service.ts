import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RecordRepository } from '../../database/record.repository.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly records: RecordRepository) {}

  async list() {
    const records: any[] = await this.records.list('notifications');
    return records.sort((a, b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)));
  }

  async markRead(id: string) {
    const item = await this.records.find<any>('notifications', id);
    if (item) await this.records.save('notifications', id, { ...item, isRead: true });
  }

  async markAllRead() {
    const items = await this.list();
    await Promise.all(items.map((item: any) => this.records.save('notifications', item.id, { ...item, isRead: true })));
  }

  async add(item: { title: string; message: string; type: string; targetSection: string; targetId?: string }) {
    const notification = { ...item, id: `notif_${randomUUID()}`, time: 'À l’instant', createdAt: new Date().toISOString(), isRead: false };
    await this.records.create('notifications', notification.id, notification);
    return notification;
  }
}
