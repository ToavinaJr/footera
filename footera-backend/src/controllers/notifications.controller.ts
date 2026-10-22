import { Controller, Get, Param, Post } from '@nestjs/common';
import { NotificationsService } from '../modules/notifications/notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list() {
    return this.notifications.list();
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string) {
    await this.notifications.markRead(id);
    return { success: true };
  }

  @Post('read-all')
  async markAllRead() {
    await this.notifications.markAllRead();
    return { success: true };
  }
}
