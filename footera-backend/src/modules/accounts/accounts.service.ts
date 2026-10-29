import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { validateSportsCvPayload } from './sports-cv.validation.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { UserContext } from '../auth/user-context.js';
import type { PlayerRecord, UserRecord } from '../../types/records.js';
import { calculateAge } from './calculate-age.js';
import { isDateOnOrBeforeToday, parseIsoDateOnly } from '../../utils/date.utils.js';
import { isValidEmailAddress, isValidPhoneNumber } from '../../utils/text.utils.js';
import { sanitizePlainText } from '../../utils/sanitize.utils.js';

@Injectable()
export class AccountsService {
  constructor(private readonly records: RecordRepository, private readonly catalogs: CatalogsService, private readonly userContext: UserContext) {}

  private get userId() {
    if (!this.userContext.userId) throw new UnauthorizedException('Contexte utilisateur absent.');
    return this.userContext.userId;
  }

  get authenticatedUserId() { return this.userContext.userId; }

  async profile(): Promise<UserRecord | null> {
    const user = await this.records.find<UserRecord>('users', this.userId);
    if (!user) return null;
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { ...safeUser, age: calculateAge(user.dateOfBirth) };
  }

  async updateProfile(partial: Record<string, unknown>) {
    const allowedFields = new Set(['name', 'phone', 'city', 'avatarUrl', 'dateOfBirth']);
    if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
      throw new BadRequestException('Le profil doit être un objet JSON.');
    }
    const fields = Object.keys(partial);
    if (!fields.length || fields.some((field) => !allowedFields.has(field))) {
      throw new BadRequestException('Le profil contient des champs non autorisés ou aucune donnée.');
    }
    for (const [field, value] of Object.entries(partial)) {
      if (typeof value !== 'string') {
        throw new BadRequestException(`${field} doit être une chaîne de caractères.`);
      }
      const normalized = sanitizePlainText(value, 2000);
      if (field === 'phone') {
        if (normalized && !isValidPhoneNumber(normalized)) {
          throw new BadRequestException('Le numéro de téléphone est invalide.');
        }
        continue;
      }
      if (field === 'dateOfBirth') {
        if (normalized) {
          if (!parseIsoDateOnly(normalized) || !isDateOnOrBeforeToday(normalized)) {
            throw new BadRequestException('La date de naissance est invalide.');
          }
        }
        continue;
      }
      if (!normalized || normalized.length > (field === 'name' ? 80 : 160) || (field === 'name' && normalized.length < 2)) {
        throw new BadRequestException(`${field} doit contenir entre 1 et 160 caractères.`);
      }
    }
    if (typeof partial.email === 'string' && !isValidEmailAddress(partial.email)) {
      throw new BadRequestException('Adresse e-mail invalide.');
    }
    if (partial.avatarUrl !== undefined) partial.avatarUrl = validateImageUrl(partial.avatarUrl, 'Photo de profil');
    const current = await this.records.find<UserRecord>('users', this.userId);
    if (!current) return null;
    const updated = await this.records.save('users', this.userId, {
      ...current,
      ...Object.fromEntries(Object.entries(partial).map(([key, value]) => [
        key,
        key === 'dateOfBirth' ? (value as string).trim() : sanitizePlainText(value, key === 'name' ? 80 : key === 'phone' ? 32 : key === 'city' ? 160 : 2000),
      ])),
    });
    if (typeof partial.dateOfBirth === 'string' || typeof partial.avatarUrl === 'string' || typeof partial.name === 'string') {
      const players = await this.records.list<PlayerRecord>('players');
      const player = players.find((item) => item.userId === this.userId);
      if (player) await this.records.save('players', player.id, {
        ...player,
        ...(typeof partial.dateOfBirth === 'string' ? { age: calculateAge(updated.dateOfBirth) ?? 0 } : {}),
        ...(typeof partial.avatarUrl === 'string' ? { avatarUrl: updated.avatarUrl } : {}),
        ...(typeof partial.name === 'string' ? { name: updated.name } : {}),
      });
    }
    return this.withoutPasswordHash({ ...updated, age: calculateAge(updated.dateOfBirth) });
  }

  async updateSportsCv(input: unknown) {
    const [positions, strongFeet] = await Promise.all([
      this.catalogs.values('playerPositions'),
      this.catalogs.values('strongFeet'),
    ]);
    const partial = validateSportsCvPayload(input, positions, strongFeet);
    const current = await this.records.find<UserRecord>('users', this.userId);
    if (!current) return null;
    const updated = await this.records.save('users', this.userId, { ...current, sportsCv: { ...current.sportsCv, ...partial } });
    return this.withoutPasswordHash({ ...updated, age: calculateAge(updated.dateOfBirth) });
  }

  async setActiveRole(role: string) {
    const current = await this.records.find<UserRecord>('users', this.userId);
    if (!current?.roles?.includes(role)) throw new BadRequestException('Rôle non autorisé pour ce compte.');
    if (!current) return null;
    const updated = await this.records.save('users', this.userId, { ...current, activeRole: role });
    return this.withoutPasswordHash({ ...updated, age: calculateAge(updated.dateOfBirth) });
  }

  async updatePreferences(input: unknown) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('Préférences invalides.');
    const values = input as Record<string, unknown>;
    if (!Object.keys(values).length || Object.keys(values).some((key) => !['language', 'showPersonalActivity'].includes(key))
      || (values.language !== undefined && !['fr', 'en', 'mg'].includes(String(values.language)))
      || (values.showPersonalActivity !== undefined && typeof values.showPersonalActivity !== 'boolean')) throw new BadRequestException('Préférences invalides.');
    await this.records.updateUserPreferences(this.userId, values);
    return this.profile();
  }

  private async toggleFavorite(field: 'favoriteTeamIds' | 'favoriteMatchIds', id: string) {
    const current = await this.records.find<UserRecord>('users', this.userId);
    if (!current) return false;
    const favorites = current[field] ?? [];
    const exists = favorites.includes(id);
    const updated = exists ? favorites.filter((favorite) => favorite !== id) : [...favorites, id];
    await this.records.save('users', this.userId, { ...current, [field]: updated });
    return !exists;
  }

  toggleFavoriteTeam(id: string) { return this.toggleFavorite('favoriteTeamIds', id); }
  toggleFavoriteMatch(id: string) { return this.toggleFavorite('favoriteMatchIds', id); }

  private withoutPasswordHash<T extends Record<string, unknown>>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

}
