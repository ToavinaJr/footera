import { Controller, Get } from '@nestjs/common';
import { ClubsService } from '../modules/clubs/clubs.service.js';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get()
  list() {
    return this.clubs.list();
  }
}
