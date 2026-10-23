import { Body, Controller, Get, Param, Query, Post, Put, NotFoundException } from '@nestjs/common';
import { MatchesService } from '../modules/matches/matches.service.js';
import { Public } from '../modules/auth/public.decorator.js';
import type { UpdateMatchInput } from '../types/records.js';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  @Public()
  list(@Query('status') status?: string) {
    return this.matches.list(status);
  }

  @Get('standings')
  @Public()
  getStandings(@Query('tournamentId') tournamentId?: string) {
    return this.matches.standings(tournamentId);
  }

  @Get('manageable')
  manageable() {
    return this.matches.manageableMatchIds();
  }

  @Get(':id')
  @Public()
  async getById(@Param('id') id: string) {
    const match = await this.matches.getById(id);
    if (!match) throw new NotFoundException('Match introuvable');
    return match;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateMatchInput) {
    return this.matches.update(id, body);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.matches.start(id);
  }

  @Post(':id/finish')
  finish(@Param('id') id: string) {
    return this.matches.finish(id);
  }

  @Post(':id/follow')
  toggleFollow(@Param('id') id: string) {
    return this.matches.toggleFavorite(id);
  }
}
