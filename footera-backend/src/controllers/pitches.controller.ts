import { Controller, Get, Param, Query, Post, Body, NotFoundException } from '@nestjs/common';
import { BookingsService } from '../modules/bookings/bookings.service.js';
import type { CreatePitchInput } from '../modules/bookings/bookings.service.js';
import { createPitchBodyPipe } from '../modules/bookings/pitch-request.validation.js';
import { ratePitchBodyPipe } from '../modules/bookings/pitch-review-request.validation.js';

@Controller('pitches')
export class PitchesController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list(@Query('city') city?: string, @Query('surface') surface?: string, @Query('date') date?: string) {
    return this.bookings.listPitches({ city, surface, date });
  }

  @Get('options')
  options() {
    return this.bookings.getPitchOptions();
  }

  @Post(':id/reviews')
  rate(@Param('id') id: string, @Body(ratePitchBodyPipe) body: { rating: number; comment?: string }) {
    return this.bookings.ratePitch(id, body);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Query('date') date?: string) {
    const pitch = await this.bookings.getPitch(id, date);
    if (!pitch) throw new NotFoundException('Terrain introuvable');
    return pitch;
  }

  @Post()
  create(@Body(createPitchBodyPipe) body: CreatePitchInput) {
    return this.bookings.createPitch(body);
  }
}
