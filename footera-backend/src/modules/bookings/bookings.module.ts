import { Module } from '@nestjs/common';
import { BookingsController } from '../../controllers/bookings.controller.js';
import { PitchesController } from '../../controllers/pitches.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { DatabaseModule } from '../database.module.js';
import { CatalogsModule } from '../catalogs/catalogs.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { BookingsService } from './bookings.service.js';

@Module({ imports: [DatabaseModule, AccountsModule, NotificationsModule, CatalogsModule], controllers: [BookingsController, PitchesController], providers: [BookingsService], exports: [BookingsService] })
export class BookingsModule {}
