import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { buildTournamentStandings } from '../tournaments/tournament-standings.js';
import type { MatchRecord, TeamRecord, TournamentRecord } from '../../database/domain-records.js';

@Injectable()
export class MatchesService {
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService) {}
  async list(status?: string) {
    const matches = await this.records.list<MatchRecord>('matches');
    return status && status !== 'ALL' ? matches.filter((match) => match.status === status) : matches;
  }
  getById(id: string) { return this.records.find('matches', id); }
  async standings(tournamentId?: string) {
    const [tournaments, teams, matches] = await Promise.all([
      this.records.list<TournamentRecord>('tournaments'), this.records.list<TeamRecord>('teams'), this.records.list<MatchRecord>('matches'),
    ]);
    const tournament = tournamentId
      ? tournaments.find((item) => item.id === tournamentId)
      : tournaments.find((item) => item.id === 'championnat_r2_2026') ?? tournaments[0];
    if (!tournament) return [];
    return buildTournamentStandings(tournament, teams, matches);
  }
  activityFeed() { return this.records.list('activity'); }
  async toggleFavorite(id: string) {
    const match = await this.records.find<MatchRecord>('matches', id);
    if (!match) throw new NotFoundException('Match introuvable.');

    const profile = await this.accounts.profile();
    const isAlreadyFollowed = profile?.favoriteMatchIds?.includes(id) ?? false;
    if (match.status === 'FINISHED' && !isAlreadyFollowed) {
      throw new ConflictException('Un match terminé ne peut plus être suivi.');
    }

    return this.accounts.toggleFavoriteMatch(id);
  }
}
