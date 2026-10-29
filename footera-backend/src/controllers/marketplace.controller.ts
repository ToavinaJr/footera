import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';
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
    @Query('maxPrice') maxPrice?: string,
  ) {
    const parsedMaxPrice = maxPrice === undefined || maxPrice.trim() === ''
      ? undefined
      : Number(maxPrice);

    return this.marketplace.list({
      query,
      category,
      maxPrice: parsedMaxPrice !== undefined && Number.isFinite(parsedMaxPrice)
        ? parsedMaxPrice
        : undefined,
    });
  }

  @Post()
  create(@Body(createMarketplaceBodyPipe) body: CreateMarketplaceInput) {
    return this.marketplace.create(body);
  }

  @Get(':id')
  @Public()
  get(@Param('id') id: string) { return this.marketplace.get(id); }
}
