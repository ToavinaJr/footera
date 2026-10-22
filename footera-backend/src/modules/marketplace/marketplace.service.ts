import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';

export const MARKETPLACE_CATEGORIES = ['Crampons', 'Maillots', 'Ballons', 'Gardiens', 'Équipements'];

@Injectable()
export class MarketplaceService {
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService, private readonly notifications: NotificationsService) {}
  categories() { return MARKETPLACE_CATEGORIES; }

  async list(filters: { query?: string; category?: string; maxPrice?: number } = {}) {
    const items = await this.records.list<any>('marketplace');
    return items.filter((item) => item.isAvailable !== false
      && (!filters.query || `${item.title} ${item.brand} ${item.city}`.toLowerCase().includes(filters.query.toLowerCase()))
      && (!filters.category || filters.category === 'Toutes' || item.category === filters.category)
      && (!filters.maxPrice || filters.maxPrice <= 0 || item.price <= filters.maxPrice));
  }
  async create(input: any) {
    if (!MARKETPLACE_CATEGORIES.includes(input?.category)) {
      throw new BadRequestException('Catégorie Marketplace invalide.');
    }
    input.imageUrl = validateImageUrl(input.imageUrl, 'Photo de l’article');
    const user: any = await this.accounts.profile();
    if (!user?.roles?.includes('Vendeur')) {
      throw new ForbiddenException('Votre compte doit disposer du rôle Vendeur pour publier un article.');
    }
    const id = `mkt_${randomUUID()}`;
    const item = { ...input, id, sellerName: user?.name || 'Vendeur Footera', sellerRating: 5, createdAt: "À l'instant", isAvailable: true };
    await this.records.create('marketplace', id, item);
    await this.notifications.add({ title: 'Annonce mise en ligne', message: `Votre article "${item.title}" (${item.price}€) est publié.`, type: 'marketplace', targetSection: 'marketplace', targetId: id });
    return item;
  }
}
