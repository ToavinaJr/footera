import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { validateSportsCvPayload } from './sports-cv.validation.js';

const USER_ID = 'usr_me';

@Injectable()
export class AccountsService {
  constructor(private readonly records: RecordRepository) {}

  profile() { return this.records.find('users', USER_ID); }

  async updateProfile(partial: Record<string, unknown>) {
    const allowedFields = new Set(['name', 'email', 'phone', 'city', 'avatarUrl']);
    if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
      throw new BadRequestException('Le profil doit être un objet JSON.');
    }
    const fields = Object.keys(partial);
    if (!fields.length || fields.some((field) => !allowedFields.has(field))) {
      throw new BadRequestException('Le profil contient des champs non autorisés ou aucune donnée.');
    }
    for (const [field, value] of Object.entries(partial)) {
      if (typeof value !== 'string' || !value.trim() || value.trim().length > 160) {
        throw new BadRequestException(`${field} doit contenir entre 1 et 160 caractères.`);
      }
    }
    if (typeof partial.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partial.email)) {
      throw new BadRequestException('Adresse e-mail invalide.');
    }
    const current = await this.profile();
    return current ? this.records.save('users', USER_ID, {
      ...current,
      ...Object.fromEntries(Object.entries(partial).map(([key, value]) => [key, (value as string).trim()])),
    }) : null;
  }

  async updateSportsCv(input: unknown) {
    const partial = validateSportsCvPayload(input);
    const current: any = await this.profile();
    if (!current) return null;
    return this.records.save('users', USER_ID, { ...current, sportsCv: { ...current.sportsCv, ...partial } });
  }

  async setActiveRole(role: string) {
    const current: any = await this.profile();
    if (!current?.roles?.includes(role)) throw new BadRequestException('Rôle non autorisé pour ce compte.');
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
