import { Module } from '@nestjs/common';
import { MarketplaceController } from '../../controllers/marketplace.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { DatabaseModule } from '../database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MarketplaceService } from './marketplace.service.js';

@Module({ imports: [DatabaseModule, AccountsModule, NotificationsModule], controllers: [MarketplaceController], providers: [MarketplaceService] })
export class MarketplaceModule {}
