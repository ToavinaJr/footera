import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { BookingsService } from '../modules/bookings/bookings.service.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list() {
    return this.bookings.listBookings();
  }

  @Post('quote')
  quote(@Body() body: { pitchId: string; selections: Array<{ date: string; time: string }> }) {
    return this.bookings.quoteBookings(body);
  }

  @Post('batch')
  createBatch(@Body() body: { pitchId: string; selections: Array<{ date: string; time: string }>; teamName?: string }) {
    return this.bookings.createBookings(body);
  }

  @Post()
  create(@Body() body: any) {
    return this.bookings.createBooking(body);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookings.cancelBooking(id);
  }
}
