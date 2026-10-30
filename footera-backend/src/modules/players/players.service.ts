import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import type { PlayerRecord, TeamRecord, UserRecord } from '../../types/records.js';
import { PlayerMatchStatsService } from './player-match-stats.service.js';
import { calculateAge } from '../accounts/calculate-age.js';
import { AccountsService } from '../accounts/accounts.service.js';

@Injectable()
export class PlayersService {
  constructor(
    private readonly records: RecordRepository,
    private readonly catalogs: CatalogsService,
    private readonly matchStats: PlayerMatchStatsService,
    private readonly accounts: AccountsService,
  ) {}

  async getCurrentUserPlayer() {
    const user = await this.accounts.profile();
    if (!user) throw new UnauthorizedException('Authentification requise.');
    const player = (await this.records.list<PlayerRecord>('players')).find((record) => record.userId === user.id);
    if (!player) throw new NotFoundException('Aucun profil joueur n’est associé à ce compte.');
    return this.getById(player.id);
  }

  async options() {
    const options = await this.catalogs.options();
    return { positions: options.playerPositions, levels: options.playerLevels };
  }

  async list(filters: { query?: string; position?: string | string[]; city?: string; level?: string | string[]; transferOnly?: boolean; competitionId?: string } = {}) {
    const [players, users, teams] = await Promise.all([
      this.records.list<PlayerRecord>('players'),
      this.records.list<UserRecord>('users'),
      this.records.list<TeamRecord>('teams'),
    ]);
    const matchStats = await this.matchStats.aggregate({ competitionId: filters.competitionId }, players);
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
        minutesPlayed: stats?.minutesPlayed ?? 0,
        teamHistoryStats: stats ? [...stats.teamStats.values()].map((teamStats) => ({
          teamId: teamStats.teamId,
          teamName: teams.find((team) => team.id === teamStats.teamId)?.name ?? 'Équipe historique',
          appearances: teamStats.appearances,
          minutesPlayed: teamStats.minutesPlayed,
          goals: teamStats.goals,
          assists: teamStats.assists,
          yellowCards: teamStats.yellowCards,
          redCards: teamStats.redCards,
        })) : [],
      };
    });
    const positions = (Array.isArray(filters.position) ? filters.position : filters.position?.split(',') ?? []).filter(Boolean);
    const levels = (Array.isArray(filters.level) ? filters.level : filters.level?.split(',') ?? []).filter(Boolean);
    return enrichedPlayers.filter((player) => {
      const query = filters.query?.toLowerCase();
      return (!query || `${player.name} ${player.city}`.toLowerCase().includes(query))
        && (!positions.length || positions.includes('Toutes') || positions.includes(player.primaryPosition) || Boolean(player.secondaryPosition && positions.includes(player.secondaryPosition)))
        && (!filters.city || filters.city === 'Toutes' || player.city?.toLowerCase() === filters.city.toLowerCase())
        && (!levels.length || levels.includes('Tous') || levels.includes(player.level))
        && (!filters.transferOnly || player.isAvailableForTransfer);
    });
  }

  async getById(id: string) {
    const players = await this.list();
    const player = players.find((item) => item.id === id);
    if (!player) return null;
    const source = await this.records.find<PlayerRecord>('players', id);
    const user = source?.userId ? await this.records.find<UserRecord>('users', source.userId) : null;
    return {
      ...player,
      ...(user?.email ? { email: user.email } : {}),
      ...(user?.phone?.trim() ? { phone: user.phone } : {}),
    };
  }

  async getMatchStats(id: string, competitionId?: string) {
    return competitionId ? this.matchStats.competition(id, competitionId) : this.matchStats.career(id);
  }

}
