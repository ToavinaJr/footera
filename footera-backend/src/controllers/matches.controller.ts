import { Controller, Get, Param, Query, Post, NotFoundException } from '@nestjs/common';
import { MatchesService } from '../modules/matches/matches.service.js';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.matches.list(status);
  }

  @Get('standings')
  getStandings() {
    return this.matches.standings();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const match = await this.matches.getById(id);
    if (!match) throw new NotFoundException('Match introuvable');
    return match;
  }

  @Post(':id/follow')
  toggleFollow(@Param('id') id: string) {
    return this.matches.toggleFavorite(id);
  }
}
