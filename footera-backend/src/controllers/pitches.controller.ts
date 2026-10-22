import { Controller, Get, Param, Query, Post, Body, NotFoundException } from '@nestjs/common';
import { BookingsService } from '../modules/bookings/bookings.service.js';

@Controller('pitches')
export class PitchesController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list(@Query('city') city?: string, @Query('surface') surface?: string) {
    return this.bookings.listPitches({ city, surface });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const pitch = await this.bookings.getPitch(id);
    if (!pitch) throw new NotFoundException('Terrain introuvable');
    return pitch;
  }

  @Post()
  create(@Body() body: any) {
    return this.bookings.createPitch(body);
  }
}
