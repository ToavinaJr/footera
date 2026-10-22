import { Module } from '@nestjs/common';
import { RecruitmentController } from '../../controllers/recruitment.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RecruitmentService } from './recruitment.service.js';

@Module({ imports: [DatabaseModule, AccountsModule, NotificationsModule], controllers: [RecruitmentController], providers: [RecruitmentService] })
export class RecruitmentModule {}
