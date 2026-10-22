import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';
import { ClubsModule } from './modules/clubs/clubs.module.js';
import { CatalogsModule } from './modules/catalogs/catalogs.module.js';
import { DatabaseModule } from './modules/database.module.js';
import { MarketplaceModule } from './modules/marketplace/marketplace.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { PlayersModule } from './modules/players/players.module.js';
import { RecruitmentModule } from './modules/recruitment/recruitment.module.js';
import { StatsModule } from './modules/stats/stats.module.js';
import { TeamsModule } from './modules/teams/teams.module.js';
import { TournamentsModule } from './modules/tournaments/tournaments.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';

@Module({
  imports: [
    DatabaseModule,
    CatalogsModule,
    AccountsModule,
    PlayersModule,
    TeamsModule,
    ClubsModule,
    MatchesModule,
    TournamentsModule,
    BookingsModule,
    RecruitmentModule,
    MarketplaceModule,
    NotificationsModule,
    StatsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
