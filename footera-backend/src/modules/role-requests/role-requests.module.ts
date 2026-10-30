import { Module } from '@nestjs/common';
import { RoleRequestsController } from '../../controllers/role-requests.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { DatabaseModule } from '../database.module.js';
import { RoleRequestsService } from './role-requests.service.js';

@Module({ imports: [DatabaseModule, AccountsModule], controllers: [RoleRequestsController], providers: [RoleRequestsService] })
export class RoleRequestsModule {}
