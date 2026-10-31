import { Controller, Get, Param, Query, Post, Patch, Body, NotFoundException, HttpCode, HttpStatus, Delete } from '@nestjs/common';
import { TeamsService } from '../modules/teams/teams.service.js';
import { Public } from '../modules/auth/public.decorator.js';
import {
  joinTeamBodyPipe,
  remindTeamMembersBodyPipe,
  updateTeamJoinRequestBodyPipe,
} from '../modules/teams/team-mutation-request.validation.js';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  @Public()
  list(@Query('q') query?: string, @Query('category') category?: string, @Query('city') city?: string) {
    return this.teams.list({ query, category, city });
  }

  @Get('my-team')
  async getMyTeam() {
    return { team: await this.teams.myTeam() };
  }

  @Get('my-team/invitations')
  listMyTeamInvitations() {
    return this.teams.listMyTeamInvitations();
  }

  @Get('my-team/join-requests')
  listMyTeamJoinRequests() {
    return this.teams.listMyTeamJoinRequests();
  }

  @Get('my-join-requests')
  listMyJoinRequests() {
    return this.teams.listMyJoinRequests();
  }

  @Patch('my-join-requests/:requestId')
  updateMyJoinRequest(@Param('requestId') requestId: string, @Body(updateTeamJoinRequestBodyPipe) body: { message: string; position: string }) {
    return this.teams.updateMyJoinRequest(requestId, body.message, body.position);
  }

  @Delete('my-join-requests/:requestId')
  cancelMyJoinRequest(@Param('requestId') requestId: string) {
    return this.teams.cancelMyJoinRequest(requestId);
  }

  @Delete('my-team/membership')
  leaveCurrentTeam() {
    return this.teams.leaveCurrentTeam();
  }

  @Post('my-team/join-requests/:requestId/accept')
  acceptJoinRequest(@Param('requestId') requestId: string) {
    return this.teams.respondToJoinRequest(requestId, true);
  }

  @Post('my-team/join-requests/:requestId/decline')
  declineJoinRequest(@Param('requestId') requestId: string) {
    return this.teams.respondToJoinRequest(requestId, false);
  }

  @Post(':id/reminders')
  remindMembers(@Param('id') id: string, @Body(remindTeamMembersBodyPipe) body: { message: string }) {
    return this.teams.remindMembers(id, body.message);
  }

  @Get(':id/detail')
  @Public()
  async getDetail(
    @Param('id') id: string,
    @Query('competitionId') competitionId?: string,
    @Query('sortBy') sortBy?: 'goals' | 'assists' | 'appearances' | 'yellowCards' | 'redCards',
  ) {
    const team = await this.teams.getDetail(id, { competitionId, sortBy });
    if (!team) throw new NotFoundException('Ã‰quipe introuvable');
    return team;
  }

  @Get(':id/players')
  @Public()
  async listPlayers(@Param('id') id: string, @Query('competitionId') competitionId?: string) {
    const players = await this.teams.listPlayers(id, competitionId);
    if (!players) throw new NotFoundException('Équipe introuvable');
    return players;
  }

  @Get(':id')
  @Public()
  async getById(@Param('id') id: string) {
    const team = await this.teams.getById(id);
    if (!team) throw new NotFoundException('Équipe introuvable');
    return team;
  }

  @Post(':id/join')
  joinTeam(@Param('id') id: string, @Body(joinTeamBodyPipe) body: { message: string; position: string }) {
    return this.teams.requestJoin(id, body.message, body.position);
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(@Param('id') id: string) {
    const isFavorite = await this.teams.toggleFavorite(id);
    return { isFavorite };
  }
}
