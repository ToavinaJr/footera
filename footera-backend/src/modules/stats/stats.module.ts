import { Module } from '@nestjs/common';
import { StatsController } from '../../controllers/stats.controller.js';
import { PlayersModule } from '../players/players.module.js';
import { TeamsModule } from '../teams/teams.module.js';
import { DatabaseModule } from '../database.module.js';
import { StatsService } from './stats.service.js';

@Module({ imports: [DatabaseModule, PlayersModule, TeamsModule], controllers: [StatsController], providers: [StatsService] })
export class StatsModule {}
