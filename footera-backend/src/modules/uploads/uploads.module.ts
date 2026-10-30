import { Module } from '@nestjs/common';
import { UploadsController } from '../../controllers/uploads.controller.js';
import { UploadsService } from './uploads.service.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { DatabaseModule } from '../database.module.js';

@Module({ imports: [AccountsModule, DatabaseModule], controllers: [UploadsController], providers: [UploadsService] })
export class UploadsModule {}
