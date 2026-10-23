import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { validateSportsCvPayload } from './sports-cv.validation.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { UserContext } from '../auth/user-context.js';

@Injectable()
export class AccountsService {
  constructor(private readonly records: RecordRepository, private readonly catalogs: CatalogsService, private readonly userContext: UserContext) {}

  private get userId() {
    if (!this.userContext.userId) throw new UnauthorizedException('Contexte utilisateur absent.');
    return this.userContext.userId;
  }

  async profile() {
    const user: any = await this.records.find('users', this.userId);
    if (!user) return null;
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
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
      const normalized = value.trim();
      if (field === 'phone') {
        if (normalized.length > 32 || (normalized && !/^[+()\d.\-\s]{7,32}$/.test(normalized))) {
          throw new BadRequestException('Le numéro de téléphone est invalide.');
        }
        continue;
      }
      if (field === 'dateOfBirth') {
        if (normalized) {
          const parsed = new Date(`${normalized}T00:00:00.000Z`);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(parsed.valueOf())
            || parsed.toISOString().slice(0, 10) !== normalized
            || normalized > new Date().toISOString().slice(0, 10)) {
            throw new BadRequestException('La date de naissance est invalide.');
          }
        }
        continue;
      }
      if (!normalized || normalized.length > 160) {
        throw new BadRequestException(`${field} doit contenir entre 1 et 160 caractères.`);
      }
    }
    if (typeof partial.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partial.email)) {
      throw new BadRequestException('Adresse e-mail invalide.');
    }
    if (partial.avatarUrl !== undefined) partial.avatarUrl = validateImageUrl(partial.avatarUrl, 'Photo de profil');
    const current: any = await this.records.find('users', this.userId);
    if (!current) return null;
    const updated = await this.records.save('users', this.userId, {
      ...current,
      ...Object.fromEntries(Object.entries(partial).map(([key, value]) => [key, (value as string).trim()])),
    });
    if (typeof partial.dateOfBirth === 'string') {
      const players: any[] = await this.records.list('players');
      const player = players.find((item) => item.userId === this.userId);
      if (player) await this.records.save('players', player.id, { ...player, age: 0 });
    }
    return this.withoutPasswordHash(updated);
  }

  async updateSportsCv(input: unknown) {
    const [positions, strongFeet] = await Promise.all([
      this.catalogs.values('playerPositions'),
      this.catalogs.values('strongFeet'),
    ]);
    const partial = validateSportsCvPayload(input, positions, strongFeet);
    const current: any = await this.records.find('users', this.userId);
    if (!current) return null;
    const updated = await this.records.save('users', this.userId, { ...current, sportsCv: { ...current.sportsCv, ...partial } });
    return this.withoutPasswordHash(updated);
  }

  async setActiveRole(role: string) {
    const current: any = await this.records.find('users', this.userId);
    if (!current?.roles?.includes(role)) throw new BadRequestException('Rôle non autorisé pour ce compte.');
    if (!current) return null;
    const updated = await this.records.save('users', this.userId, { ...current, activeRole: role });
    return this.withoutPasswordHash(updated);
  }

  private async toggleFavorite(field: 'favoriteTeamIds' | 'favoriteMatchIds', id: string) {
    const current: any = await this.records.find('users', this.userId);
    if (!current) return false;
    const favorites: string[] = current[field] || [];
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
