import { Module } from '@nestjs/common';
import { BookingsController } from '../../controllers/bookings.controller.js';
import { PitchesController } from '../../controllers/pitches.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { BookingsService } from './bookings.service.js';

@Module({ imports: [DatabaseModule, AccountsModule, NotificationsModule], controllers: [BookingsController, PitchesController], providers: [BookingsService], exports: [BookingsService] })
export class BookingsModule {}
