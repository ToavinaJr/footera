import { Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import type { MatchRecord, PlayerRecord, TournamentRecord } from '../../types/records.js';
import { aggregatePlayerMatchStats } from './player-match-stats.js';

export interface PlayerCareerStats {
  appearances: number;
  minutesPlayed: number | null;
  goals: number;
  penalties: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  teamStats: Array<{
    teamId: string;
    appearances: number;
    minutesPlayed: number | null;
    goals: number;
    penalties: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  }>;
}

@Injectable()
export class PlayerMatchStatsService {
  constructor(private readonly records: RecordRepository) {}

  async aggregate(filters: { competitionId?: string; teamId?: string } = {}, knownPlayers?: PlayerRecord[]) {
    const [players, matches, tournaments] = await Promise.all([
      knownPlayers ? Promise.resolve(knownPlayers) : this.records.list<PlayerRecord>('players'),
      this.records.list<MatchRecord>('matches'),
      this.records.list<TournamentRecord>('tournaments'),
    ]);
    return aggregatePlayerMatchStats(players, matches, filters, tournaments);
  }

  async career(playerId: string): Promise<PlayerCareerStats | null> {
    return this.calculate(playerId);
  }

  async competition(playerId: string, competitionId: string): Promise<PlayerCareerStats | null> {
    return this.calculate(playerId, competitionId);
  }

  private async calculate(playerId: string, competitionId?: string): Promise<PlayerCareerStats | null> {
    const players = await this.records.list<PlayerRecord>('players');
    if (!players.some((player) => player.id === playerId)) return null;
    const stats = (await this.aggregate({ competitionId }, players)).get(playerId);
    return {
      appearances: stats?.appearances ?? 0,
      minutesPlayed: stats?.minutesPlayed ?? (stats ? null : 0),
      goals: stats?.goals ?? 0,
      penalties: stats?.penalties ?? 0,
      assists: stats?.assists ?? 0,
      yellowCards: stats?.yellowCards ?? 0,
      redCards: stats?.redCards ?? 0,
      teamStats: stats ? [...stats.teamStats.values()].map(({ teamId, ...teamStat }) => ({ teamId, ...teamStat })) : [],
    };
  }
}
