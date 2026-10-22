import { Module } from '@nestjs/common';
import { UploadsController } from '../../controllers/uploads.controller.js';
import { UploadsService } from './uploads.service.js';
import { AccountsModule } from '../accounts/accounts.module.js';

@Module({ imports: [AccountsModule], controllers: [UploadsController], providers: [UploadsService] })
export class UploadsModule {}
