import { Module } from '@nestjs/common';
import { PlayersController } from '../../controllers/players.controller.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TeamsModule } from '../teams/teams.module.js';
import { PlayersService } from './players.service.js';

@Module({ imports: [DatabaseModule, NotificationsModule, TeamsModule], controllers: [PlayersController], providers: [PlayersService], exports: [PlayersService] })
export class PlayersModule {}
