import { Controller, Get, Param, Query, Post, Body, NotFoundException } from '@nestjs/common';
import { PlayersService } from '../modules/players/players.service.js';
import { NotificationsService } from '../modules/notifications/notifications.service.js';

@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService, private readonly notifications: NotificationsService) {}

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
  async invite(@Param('id') id: string, @Body('message') message?: string) {
    const player = await this.players.getById(id);
    if (!player) throw new NotFoundException('Joueur introuvable');
    await this.notifications.add({
      title: 'Invitation reçue',
      message: message || `Une équipe souhaite vous inviter à un essai.`,
      type: 'team',
      targetSection: 'teams',
      targetId: id,
    });
    return { success: true, message: `Invitation transmise à ${player.name} !` };
  }
}
