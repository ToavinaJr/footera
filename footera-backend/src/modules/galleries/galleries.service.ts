import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { UserContext } from '../auth/user-context.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';
import type { ClubRecord, PitchRecord, PlayerRecord, TeamRecord, TournamentRecord } from '../../types/records.js';

export type GalleryEntity = 'players' | 'clubs' | 'pitches' | 'tournaments';
type GalleryRecord = PlayerRecord | ClubRecord | PitchRecord | TournamentRecord;

@Injectable()
export class GalleriesService {
  constructor(private readonly records: RecordRepository, private readonly userContext: UserContext) {}

  async get(entity: GalleryEntity, id: string) {
    const record = await this.findRecord(entity, id);
    if (!record) throw new NotFoundException('Élément introuvable.');
    return { images: this.imagesOf(record), canManage: await this.canManage(entity, record) };
  }

  async add(entity: GalleryEntity, id: string, imageUrl: unknown) {
    const record = await this.findRecord(entity, id);
    if (!record) throw new NotFoundException('Élément introuvable.');
    await this.assertCanManage(entity, record);
    if (typeof imageUrl !== 'string') throw new BadRequestException('URL de la photo manquante.');
    const validatedUrl = validateImageUrl(imageUrl, 'Photo de galerie');
    const images = this.imagesOf(record);
    if (images.includes(validatedUrl)) return { images };
    if (images.length >= 20) throw new BadRequestException('La galerie est limitée à 20 photos.');
    const updated = { ...record, galleryImages: [...images, validatedUrl] };
    await this.records.save(this.collection(entity), id, updated);
    return { images: updated.galleryImages };
  }

  async remove(entity: GalleryEntity, id: string, imageUrl: unknown) {
    const record = await this.findRecord(entity, id);
    if (!record) throw new NotFoundException('Élément introuvable.');
    await this.assertCanManage(entity, record);
    if (typeof imageUrl !== 'string') throw new BadRequestException('URL de la photo manquante.');
    const images = this.imagesOf(record);
    if (!images.includes(imageUrl)) throw new NotFoundException('Photo introuvable dans cette galerie.');
    const updated = { ...record, galleryImages: images.filter((url) => url !== imageUrl) };
    await this.records.save(this.collection(entity), id, updated);
    return { images: updated.galleryImages };
  }

  async replace(entity: GalleryEntity, id: string, previousImageUrl: unknown, imageUrl: unknown) {
    const record = await this.findRecord(entity, id);
    if (!record) throw new NotFoundException('Élément introuvable.');
    await this.assertCanManage(entity, record);
    if (typeof previousImageUrl !== 'string' || typeof imageUrl !== 'string') {
      throw new BadRequestException('Les URLs de photo sont obligatoires.');
    }
    const validatedUrl = validateImageUrl(imageUrl, 'Photo de galerie');
    const images = this.imagesOf(record);
    const index = images.indexOf(previousImageUrl);
    if (index < 0) throw new NotFoundException('Photo introuvable dans cette galerie.');
    const updatedImages = images.includes(validatedUrl)
      ? images.filter((url) => url !== previousImageUrl)
      : images.map((url, imageIndex) => imageIndex === index ? validatedUrl : url);
    await this.records.save(this.collection(entity), id, { ...record, galleryImages: updatedImages });
    return { images: updatedImages };
  }

  private async findRecord(entity: GalleryEntity, id: string): Promise<GalleryRecord | null> {
    switch (entity) {
      case 'players': return this.records.find<PlayerRecord>('players', id);
      case 'clubs': return this.records.find<ClubRecord>('clubs', id);
      case 'pitches': return this.records.find<PitchRecord>('pitches', id);
      case 'tournaments': return this.records.find<TournamentRecord>('tournaments', id);
    }
  }

  private collection(entity: GalleryEntity) {
    return entity;
  }

  private imagesOf(record: GalleryRecord): string[] {
    return Array.isArray(record.galleryImages) ? record.galleryImages.filter((url): url is string => typeof url === 'string') : [];
  }

  private async canManage(entity: GalleryEntity, record: GalleryRecord): Promise<boolean> {
    const userId = this.userContext.userId;
    if (!userId) return false;
    if (entity === 'players') return (record as PlayerRecord).userId === userId;
    if (entity === 'pitches') return (record as PitchRecord).ownerId === userId;
    if (entity === 'tournaments') return (record as TournamentRecord).organizerId === userId;
    const club = record as ClubRecord;
    const [teams, user] = await Promise.all([
      this.records.list<TeamRecord>('teams'),
      this.records.find<import('../../types/records.js').UserRecord>('users', userId),
    ]);
    const clubTeamIds = new Set((club.teams ?? []).map((team) => team.id));
    return teams.some((team) => clubTeamIds.has(team.id)
      && (team.ownerId === userId || team.managerIds?.includes(userId)
        || (user?.roles?.includes('Entraîneur') && team.name === user.sportsCv?.currentTeam)));
  }

  private async assertCanManage(entity: GalleryEntity, record: GalleryRecord) {
    if (!this.userContext.userId) throw new UnauthorizedException('Authentification requise.');
    if (!await this.canManage(entity, record)) throw new ForbiddenException('Vous ne pouvez modifier que la galerie de votre élément.');
  }
}
