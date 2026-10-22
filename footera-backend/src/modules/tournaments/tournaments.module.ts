import { Module } from '@nestjs/common';
import { TournamentsController } from '../../controllers/tournaments.controller.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TournamentsService } from './tournaments.service.js';

@Module({ imports: [DatabaseModule, NotificationsModule], controllers: [TournamentsController], providers: [TournamentsService], exports: [TournamentsService] })
export class TournamentsModule {}
