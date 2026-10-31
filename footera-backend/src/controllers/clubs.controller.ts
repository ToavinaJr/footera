import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ClubsService } from '../modules/clubs/clubs.service.js';
import { updateClubLogoBodyPipe } from '../modules/clubs/club-logo-request.validation.js';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get()
  list() {
    return this.clubs.list();
  }

  @Patch(':id/logo')
  updateLogo(@Param('id') id: string, @Body(updateClubLogoBodyPipe) body: { logoUrl: string }) {
    return this.clubs.updateLogo(id, body.logoUrl);
  }
}
