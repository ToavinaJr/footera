import { BadRequestException, Body, Controller, NotFoundException, Param, Put, UnauthorizedException } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { UserContext } from '../auth/user-context.js';

const favorites = { players: 'favoritePlayerIds', teams: 'favoriteTeamIds', matches: 'favoriteMatchIds', tournaments: 'favoriteTournamentIds' } as const;

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly records: RecordRepository, private readonly userContext: UserContext) {}

  @Put(':entity/:id')
  async set(@Param('entity') entity: string, @Param('id') id: string, @Body() body: { favorite?: unknown }) {
    const userId = this.userContext.userId;
    if (!userId) throw new UnauthorizedException();
    if (!Object.hasOwn(favorites, entity) || !body || Object.keys(body).some((key) => key !== 'favorite') || typeof body.favorite !== 'boolean') {
      throw new BadRequestException('Favori invalide.');
    }
    const collection = entity as keyof typeof favorites;
    const item = await this.records.find(collection, id);
    if (!item && body.favorite) throw new NotFoundException('Ressource introuvable.');
    if (collection === 'matches' && item && 'status' in item && item.status === 'FINISHED' && body.favorite) {
      const user = await this.records.find('users', userId);
      if (!user?.favoriteMatchIds?.includes(id)) throw new BadRequestException('Un match terminé ne peut plus être suivi.');
    }
    await this.records.setUserFavorite(userId, favorites[collection], id, body.favorite);
    return { isFavorite: body.favorite };
  }
}
