import { Controller, Get, Param, Query, Post, Body, NotFoundException } from '@nestjs/common';
import { PlayersService } from '../modules/players/players.service.js';
import { TeamsService } from '../modules/teams/teams.service.js';
import { Public } from '../modules/auth/public.decorator.js';
import { invitePlayerBodyPipe } from '../modules/teams/player-invitation-request.validation.js';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly players: PlayersService,
    private readonly teams: TeamsService,
  ) {}

  @Get('options')
  @Public()
  options() {
    return this.players.options();
  }

  @Get('me')
  getMine() {
    return this.players.getCurrentUserPlayer();
  }

  @Get()
  @Public()
  list(
    @Query('q') query?: string,
    @Query('position') position?: string | string[],
    @Query('city') city?: string,
    @Query('level') level?: string | string[],
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
  @Public()
  async getById(@Param('id') id: string) {
    const player = await this.players.getById(id);
    if (!player) throw new NotFoundException('Joueur introuvable');
    return player;
  }

  @Get(':id/stats')
  @Public()
  async getStats(@Param('id') id: string, @Query('competitionId') competitionId?: string) {
    const stats = await this.players.getMatchStats(id, competitionId);
    if (!stats) throw new NotFoundException('Joueur introuvable');
    return stats;
  }

  @Post(':id/invite')
  invite(@Param('id') id: string, @Body(invitePlayerBodyPipe) body: { message?: string }) {
    return this.teams.invitePlayer(id, body.message || 'Invitation à rejoindre notre équipe.');
  }
}
