import { Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { aggregatePlayerMatchStats } from './player-match-stats.js';
import type { MatchRecord, PlayerRecord, TeamRecord, TournamentRecord, UserRecord } from '../../database/domain-records.js';
import { calculateAge } from '../accounts/calculate-age.js';

@Injectable()
export class PlayersService {
  constructor(private readonly records: RecordRepository, private readonly catalogs: CatalogsService) {}

  async options() {
    const options = await this.catalogs.options();
    return { positions: options.playerPositions, levels: options.playerLevels };
  }

  async list(filters: { query?: string; position?: string; city?: string; level?: string; transferOnly?: boolean } = {}) {
    const [players, matches, users, tournaments, teams] = await Promise.all([
      this.records.list<PlayerRecord>('players'),
      this.records.list<MatchRecord>('matches'),
      this.records.list<UserRecord>('users'),
      this.records.list<TournamentRecord>('tournaments'),
      this.records.list<TeamRecord>('teams'),
    ]);
    const matchStats = aggregatePlayerMatchStats(players, matches, undefined, tournaments);
    const enrichedPlayers = players.map((player) => {
      const stats = matchStats.get(player.id);
      const user = users.find((record) => record.id === player.userId);
      const sportsCv = user?.sportsCv;
      const currentTeam = typeof sportsCv?.currentTeam === 'string' ? sportsCv.currentTeam : player.currentTeam;
      const matchingTeam = teams.find((team) => team.name?.toLowerCase() === currentTeam?.toLowerCase()
        || team.clubName?.toLowerCase() === currentTeam?.toLowerCase());
      const age = user ? calculateAge(user.dateOfBirth) : player.age;
      return {
        ...player,
        ...(sportsCv ? {
          primaryPosition: sportsCv.primaryPosition || player.primaryPosition,
          secondaryPosition: sportsCv.secondaryPosition || player.secondaryPosition,
          strongFoot: sportsCv.strongFoot || player.strongFoot,
          height: sportsCv.height || player.height,
          weight: sportsCv.weight || player.weight,
          experienceYears: sportsCv.experienceYears,
          currentTeam,
          currentTeamId: matchingTeam?.id ?? '',
          bio: sportsCv.bio || player.bio,
        } : {}),
        ...(user?.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
        ...(age !== undefined && Number.isInteger(age) && age > 0 ? { age } : { age: undefined }),
        goals: stats?.goals ?? 0,
        assists: stats?.assists ?? 0,
        yellowCards: stats?.yellowCards ?? 0,
        redCards: stats?.redCards ?? 0,
        ...(stats ? { appearances: stats.appearances } : { appearances: 0 }),
      };
    });
    return enrichedPlayers.filter((player) => {
      const query = filters.query?.toLowerCase();
      return (!query || `${player.name} ${player.city}`.toLowerCase().includes(query))
        && (!filters.position || filters.position === 'Toutes' || player.primaryPosition === filters.position || player.secondaryPosition === filters.position)
        && (!filters.city || filters.city === 'Toutes' || player.city?.toLowerCase() === filters.city.toLowerCase())
        && (!filters.level || filters.level === 'Tous' || player.level === filters.level)
        && (!filters.transferOnly || player.isAvailableForTransfer);
    });
  }

  async getById(id: string) {
    const players = await this.list();
    return players.find((player) => player.id === id) ?? null;
  }

}
