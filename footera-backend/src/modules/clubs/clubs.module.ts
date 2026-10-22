import { Module } from '@nestjs/common';
import { ClubsController } from '../../controllers/clubs.controller.js';
import { DatabaseModule } from '../database.module.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { ClubsService } from './clubs.service.js';

@Module({ imports: [DatabaseModule, AccountsModule], controllers: [ClubsController], providers: [ClubsService] })
export class ClubsModule {}
