import { Module } from '@nestjs/common';
import { PlayersController } from '../../controllers/players.controller.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TeamsModule } from '../teams/teams.module.js';
import { PlayersService } from './players.service.js';
import { PlayerMatchStatsService } from './player-match-stats.service.js';
import { AccountsModule } from '../accounts/accounts.module.js';

@Module({ imports: [DatabaseModule, NotificationsModule, TeamsModule, AccountsModule], controllers: [PlayersController], providers: [PlayersService, PlayerMatchStatsService], exports: [PlayersService, PlayerMatchStatsService] })
export class PlayersModule {}
