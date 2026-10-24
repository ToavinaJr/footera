import { ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import type { ApplicationRecord, RecruitmentAdRecord } from '../../types/records.js';
import { APPLICATION_STATUSES, APP_SECTIONS, NOTIFICATION_TYPES } from '../../types/domain.js';
import { sanitizeMultilineText, sanitizePlainText } from '../../utils/sanitize.utils.js';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService, private readonly notifications: NotificationsService) {}
  async listAds(filters: { query?: string; position?: string; division?: string } = {}) {
    return this.filterAds(await this.records.list<RecruitmentAdRecord>('recruitmentAds'), filters);
  }

  async listAvailableAds(filters: { query?: string; position?: string; division?: string } = {}) {
    const user = await this.accounts.profile();
    if (!user?.id) throw new UnauthorizedException('Connectez-vous pour consulter vos offres disponibles.');
    const [ads, applications] = await Promise.all([
      this.records.list<RecruitmentAdRecord>('recruitmentAds'),
      this.records.list<ApplicationRecord>('applications'),
    ]);
    const appliedAdIds = new Set(applications.filter((application) => application.userId === user.id).map((application) => application.adId));
    return this.filterAds(ads.filter((ad) => !appliedAdIds.has(ad.id)), filters);
  }

  private filterAds(ads: RecruitmentAdRecord[], filters: { query?: string; position?: string; division?: string }) {
    return ads.filter((ad) => (!filters.query || `${ad.teamName} ${ad.city} ${ad.description}`.toLowerCase().includes(filters.query.toLowerCase()))
      && (!filters.position || filters.position === 'Tous' || ad.positionSought === filters.position)
      && (!filters.division || filters.division === 'Toutes' || ad.division === filters.division));
  }
  getAd(id: string) { return this.records.find<RecruitmentAdRecord>('recruitmentAds', id); }
  async listApplications() {
    const user = await this.accounts.profile();
    return (await this.records.list<ApplicationRecord>('applications'))
      .filter((application) => application.userId === user?.id)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }
  async apply(adId: string, input: { message: string; phone: string }) {
    const [ad, user] = await Promise.all([this.getAd(adId), this.accounts.profile()]);
    if (!ad) throw new NotFoundException('Annonce de recrutement introuvable.');
    if (!user) throw new UnauthorizedException('Connectez-vous pour candidater.');
    const existingApplications = await this.records.list<ApplicationRecord>('applications');
    if (existingApplications.some((application) => application.userId === user.id && application.adId === adId)) {
      throw new ConflictException('Vous avez déjà postulé à cette offre.');
    }
    const id = `app_${randomUUID()}`;
    const application = {
      id, userId: user.id, adId, adTitle: `${ad.positionSought} — ${ad.teamName}`,
      teamName: ad?.teamName || 'Équipe Footera', applicantName: user?.name || 'Joueur Footera',
      applicantPosition: user?.sportsCv?.primaryPosition || 'Joueur', phone: sanitizePlainText(input.phone || user?.phone, 32),
      message: sanitizeMultilineText(input.message, 2000), submittedAt: new Date().toISOString(), status: APPLICATION_STATUSES.IN_REVIEW,
    };
    await this.records.create('applications', id, application);
    await this.records.save('recruitmentAds', adId, { ...ad, candidatesCount: Number(ad.candidatesCount || 0) + 1 });
    try {
      await this.notifications.add({ title: 'Candidature transmise', message: `Votre candidature pour ${application.teamName} a été envoyée avec succès.`, type: NOTIFICATION_TYPES.RECRUITMENT, targetSection: APP_SECTIONS.RECRUITMENT, targetId: adId });
    } catch (error: unknown) {
      this.logger.warn(`Application ${id} was saved, but its notification could not be created: ${String(error)}`);
    }
    return application;
  }
}
