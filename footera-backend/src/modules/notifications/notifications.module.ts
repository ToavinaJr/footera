import { Module } from '@nestjs/common';
import { NotificationsController } from '../../controllers/notifications.controller.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsService } from './notifications.service.js';

@Module({ imports: [DatabaseModule], controllers: [NotificationsController], providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
