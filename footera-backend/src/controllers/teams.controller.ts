import { Controller, Get, Param, Query, Post, Body, NotFoundException } from '@nestjs/common';
import { TeamsService } from '../modules/teams/teams.service.js';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  list(@Query('q') query?: string, @Query('category') category?: string) {
    return this.teams.list({ query, category });
  }

  @Get('my-team')
  getMyTeam() {
    return this.teams.myTeam();
  }

  @Get(':id/detail')
  async getDetail(@Param('id') id: string) {
    const team = await this.teams.getDetail(id);
    if (!team) throw new NotFoundException('Ã‰quipe introuvable');
    return team;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const team = await this.teams.getById(id);
    if (!team) throw new NotFoundException('Équipe introuvable');
    return team;
  }

  @Post(':id/join')
  joinTeam(@Param('id') id: string, @Body('message') message?: string) {
    return this.teams.join(id, message || 'Je souhaite rejoindre l équipe');
  }

  @Post(':id/favorite')
  toggleFavorite(@Param('id') id: string) {
    return this.teams.toggleFavorite(id);
  }
}
