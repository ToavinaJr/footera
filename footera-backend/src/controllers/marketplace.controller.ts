import { Controller, Get, Query, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { MarketplaceService } from '../modules/marketplace/marketplace.service.js';
import type { CreateMarketplaceInput } from '../modules/marketplace/marketplace.service.js';
import { createMarketplaceBodyPipe } from '../modules/marketplace/marketplace-request.validation.js';
import { Public } from '../modules/auth/public.decorator.js';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get('categories')
  @Public()
  categories() {
    return this.marketplace.categories();
  }

  @Get('options')
  @Public()
  options() {
    return this.marketplace.options();
  }

  @Get()
  @Public()
  list(
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    const parsedMinPrice = minPrice === undefined || minPrice.trim() === '' ? undefined : Number(minPrice);
    const parsedMaxPrice = maxPrice === undefined || maxPrice.trim() === ''
      ? undefined
      : Number(maxPrice);

    return this.marketplace.list({
      query,
      category,
      minPrice: parsedMinPrice !== undefined && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0 ? parsedMinPrice : undefined,
      maxPrice: parsedMaxPrice !== undefined && Number.isFinite(parsedMaxPrice)
        ? parsedMaxPrice
        : undefined,
    });
  }

  @Post('brands')
  addBrand(@Body() body: { brand?: unknown }) {
    if (typeof body?.brand !== 'string' || !body.brand.trim() || body.brand.trim().length > 80) {
      throw new BadRequestException('Le nom de marque doit contenir entre 1 et 80 caractères.');
    }
    return this.marketplace.addBrand(body.brand);
  }

  @Post()
  create(@Body(createMarketplaceBodyPipe) body: CreateMarketplaceInput) {
    return this.marketplace.create(body);
  }

  @Get(':id')
  @Public()
  get(@Param('id') id: string) { return this.marketplace.get(id); }
}
