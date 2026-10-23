import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';
import type { MarketplaceRecord } from '../../types/records.js';
import { APP_SECTIONS, NOTIFICATION_TYPES } from '../../types/domain.js';

export interface CreateMarketplaceInput {
  title: string;
  category: string;
  condition: string;
  brand: string;
  price: number;
  imageUrl: string;
  city: string;
  description: string;
}

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly records: RecordRepository,
    private readonly accounts: AccountsService,
    private readonly notifications: NotificationsService,
    private readonly catalogs: CatalogsService,
  ) {}

  async categories() {
    return this.catalogs.values('marketplaceCategories');
  }

  options() {
    return this.catalogs.options();
  }

  async list(filters: { query?: string; category?: string; maxPrice?: number } = {}) {
    const items = await this.records.list<MarketplaceRecord>('marketplace');
    return items.filter((item) => item.isAvailable !== false
      && (!filters.query || `${item.title} ${item.brand} ${item.city}`.toLowerCase().includes(filters.query.toLowerCase()))
      && (!filters.category || filters.category === 'Toutes' || item.category === filters.category)
      && (!filters.maxPrice || filters.maxPrice <= 0 || item.price <= filters.maxPrice));
  }

  async create(input: CreateMarketplaceInput) {
    const options = await this.catalogs.options();
    if (!options.marketplaceCategories.includes(input?.category)) {
      throw new BadRequestException('Catégorie Marketplace invalide.');
    }
    if (!options.marketplaceConditions.includes(input?.condition)) {
      throw new BadRequestException('État de l’article invalide.');
    }
    if (!options.marketplaceBrands.includes(input?.brand)) {
      throw new BadRequestException('Marque Marketplace invalide.');
    }

    input.imageUrl = validateImageUrl(input.imageUrl, 'Photo de l’article');
    const user = await this.accounts.profile();
    if (!user?.roles?.includes('Vendeur')) {
      throw new ForbiddenException('Votre compte doit disposer du rôle Vendeur pour publier un article.');
    }
    const id = `mkt_${randomUUID()}`;
    const item = {
      ...input,
      id,
      sellerName: user.name || 'Vendeur Footera',
      sellerRating: 5,
      createdAt: "À l’instant",
      isAvailable: true,
    };
    await this.records.create('marketplace', id, item);
    await this.notifications.add({
      title: 'Annonce mise en ligne',
      message: `Votre article "${item.title}" (${item.price} €) est publié.`,
      type: NOTIFICATION_TYPES.MARKETPLACE,
      targetSection: APP_SECTIONS.MARKETPLACE,
      targetId: id,
    });
    return item;
  }
}
