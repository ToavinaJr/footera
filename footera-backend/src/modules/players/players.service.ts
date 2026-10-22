import { Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';

@Injectable()
export class PlayersService {
  constructor(private readonly records: RecordRepository, private readonly catalogs: CatalogsService) {}

  async options() {
    const options = await this.catalogs.options();
    return { positions: options.playerPositions, levels: options.playerLevels };
  }

  async list(filters: { query?: string; position?: string; city?: string; level?: string; transferOnly?: boolean } = {}) {
    const players = await this.records.list<any>('players');
    return players.filter((player) => {
      const query = filters.query?.toLowerCase();
      return (!query || `${player.name} ${player.city}`.toLowerCase().includes(query))
        && (!filters.position || filters.position === 'Toutes' || player.primaryPosition === filters.position || player.secondaryPosition === filters.position)
        && (!filters.city || filters.city === 'Toutes' || player.city?.toLowerCase() === filters.city.toLowerCase())
        && (!filters.level || filters.level === 'Tous' || player.level === filters.level)
        && (!filters.transferOnly || player.isAvailableForTransfer);
    });
  }

  getById(id: string) { return this.records.find<any>('players', id); }
}
