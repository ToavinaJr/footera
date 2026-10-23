import { Controller, Get, Param, Query, Post, Body, NotFoundException } from '@nestjs/common';
import { PlayersService } from '../modules/players/players.service.js';
import { TeamsService } from '../modules/teams/teams.service.js';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly players: PlayersService,
    private readonly teams: TeamsService,
  ) {}

  @Get('options')
  options() {
    return this.players.options();
  }

  @Get()
  list(
    @Query('q') query?: string,
    @Query('position') position?: string,
    @Query('city') city?: string,
    @Query('level') level?: string,
    @Query('transferOnly') transferOnly?: string,
  ) {
    return this.players.list({
      query,
      position,
      city,
      level,
      transferOnly: transferOnly === 'true',
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const player = await this.players.getById(id);
    if (!player) throw new NotFoundException('Joueur introuvable');
    return player;
  }

  @Post(':id/invite')
  invite(@Param('id') id: string, @Body('message') message?: string) {
    return this.teams.invitePlayer(id, message || 'Invitation à rejoindre notre équipe.');
  }
}
