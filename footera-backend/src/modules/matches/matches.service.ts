import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service.js';
import { RecordRepository } from '../../database/record.repository.js';

@Injectable()
export class MatchesService {
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService) {}
  async list(status?: string) {
    const matches: any[] = await this.records.list('matches');
    return status && status !== 'ALL' ? matches.filter((match) => match.status === status) : matches;
  }
  getById(id: string) { return this.records.find('matches', id); }
  standings() { return this.records.list('standings'); }
  activityFeed() { return this.records.list('activity'); }
  async toggleFavorite(id: string) {
    const match: any = await this.getById(id);
    if (!match) throw new NotFoundException('Match introuvable.');

    const profile: any = await this.accounts.profile();
    const isAlreadyFollowed = profile?.favoriteMatchIds?.includes(id) ?? false;
    if (match.status === 'FINISHED' && !isAlreadyFollowed) {
      throw new ConflictException('Un match terminé ne peut plus être suivi.');
    }

    return this.accounts.toggleFavoriteMatch(id);
  }
}
