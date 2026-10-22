import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { MarketplaceService } from '../modules/marketplace/marketplace.service.js';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get()
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
  create(@Body() body: any) {
    return this.marketplace.create(body);
  }
}
