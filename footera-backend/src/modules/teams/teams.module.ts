import { Module } from '@nestjs/common';
import { TeamsController } from '../../controllers/teams.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TeamsService } from './teams.service.js';

@Module({ imports: [DatabaseModule, AccountsModule, NotificationsModule], controllers: [TeamsController], providers: [TeamsService], exports: [TeamsService] })
export class TeamsModule {}
