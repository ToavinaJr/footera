import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ClubsService } from '../modules/clubs/clubs.service.js';
import { Public } from '../modules/auth/public.decorator.js';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get()
  @Public()
  list() {
    return this.clubs.list();
  }

  @Patch(':id/logo')
  updateLogo(@Param('id') id: string, @Body('logoUrl') logoUrl: string) {
    return this.clubs.updateLogo(id, logoUrl);
  }
}
