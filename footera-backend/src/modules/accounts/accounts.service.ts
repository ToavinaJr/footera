import { Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';

const USER_ID = 'usr_me';

@Injectable()
export class AccountsService {
  constructor(private readonly records: RecordRepository) {}

  profile() { return this.records.find('users', USER_ID); }

  async updateProfile(partial: Record<string, unknown>) {
    const current = await this.profile();
    return current ? this.records.save('users', USER_ID, { ...current, ...partial }) : null;
  }

  async updateSportsCv(partial: Record<string, unknown>) {
    const current: any = await this.profile();
    if (!current) return null;
    return this.records.save('users', USER_ID, { ...current, sportsCv: { ...current.sportsCv, ...partial } });
  }

  async setActiveRole(role: string) {
    const current: any = await this.profile();
    return current ? this.records.save('users', USER_ID, { ...current, activeRole: role }) : null;
  }

  private async toggleFavorite(field: 'favoriteTeamIds' | 'favoriteMatchIds', id: string) {
    const current: any = await this.profile();
    if (!current) return false;
    const favorites: string[] = current[field] || [];
    const exists = favorites.includes(id);
    const updated = exists ? favorites.filter((favorite) => favorite !== id) : [...favorites, id];
    await this.records.save('users', USER_ID, { ...current, [field]: updated });
    return !exists;
  }

  toggleFavoriteTeam(id: string) { return this.toggleFavorite('favoriteTeamIds', id); }
  toggleFavoriteMatch(id: string) { return this.toggleFavorite('favoriteMatchIds', id); }
}
