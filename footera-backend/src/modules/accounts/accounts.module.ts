import { Module } from '@nestjs/common';
import { AuthController } from '../../controllers/auth.controller.js';
import { DatabaseModule } from '../database.module.js';
import { AccountsService } from './accounts.service.js';

@Module({ imports: [DatabaseModule], controllers: [AuthController], providers: [AccountsService], exports: [AccountsService] })
export class AccountsModule {}
