import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { BookingsService } from '../modules/bookings/bookings.service.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list() {
    return this.bookings.listBookings();
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
