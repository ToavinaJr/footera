import { Module } from '@nestjs/common';
import { NotificationsController } from '../../controllers/notifications.controller.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsService } from './notifications.service.js';
import { AuthenticationModule } from '../auth/authentication.module.js';

@Module({ imports: [DatabaseModule, AuthenticationModule], controllers: [NotificationsController], providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
