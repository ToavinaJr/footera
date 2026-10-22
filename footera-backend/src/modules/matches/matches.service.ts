import { Injectable } from '@nestjs/common';
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
  toggleFavorite(id: string) { return this.accounts.toggleFavoriteMatch(id); }
}
