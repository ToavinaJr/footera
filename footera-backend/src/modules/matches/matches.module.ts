import { Module } from '@nestjs/common';
import { ActivityFeedController } from '../../controllers/activity-feed.controller.js';
import { MatchesController } from '../../controllers/matches.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { DatabaseModule } from '../database.module.js';
import { MatchesService } from './matches.service.js';

@Module({ imports: [DatabaseModule, AccountsModule], controllers: [MatchesController, ActivityFeedController], providers: [MatchesService], exports: [MatchesService] })
export class MatchesModule {}
