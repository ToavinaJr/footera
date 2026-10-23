import { Controller, Get, Param, Post, Body, NotFoundException } from '@nestjs/common';
import { TournamentsService } from '../modules/tournaments/tournaments.service.js';
import type { CreateTournamentInput } from '../modules/tournaments/tournaments.service.js';
import { Public } from '../modules/auth/public.decorator.js';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournaments: TournamentsService) {}

  @Get()
  @Public()
  list() {
    return this.tournaments.list();
  }

  @Get(':id')
  @Public()
  async getById(@Param('id') id: string) {
    const tournament = await this.tournaments.getById(id);
    if (!tournament) throw new NotFoundException('Tournoi introuvable');
    return tournament;
  }

  @Post()
  create(@Body() body: CreateTournamentInput) {
    return this.tournaments.create(body);
  }

  @Post(':id/register')
  registerTeam(@Param('id') id: string, @Body('teamId') teamId: string) {
    return this.tournaments.register(id, teamId);
  }
}
