import { Module } from '@nestjs/common';
import { ClubsController } from '../../controllers/clubs.controller.js';
import { DatabaseModule } from '../database.module.js';
import { ClubsService } from './clubs.service.js';

@Module({ imports: [DatabaseModule], controllers: [ClubsController], providers: [ClubsService] })
export class ClubsModule {}
