import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import type { ApplicationRecord, RecruitmentAdRecord } from '../../types/records.js';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService, private readonly notifications: NotificationsService) {}
  async listAds(filters: { query?: string; position?: string; division?: string } = {}) {
    const ads = await this.records.list<RecruitmentAdRecord>('recruitmentAds');
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
    const id = `app_${randomUUID()}`;
    const application = {
      id, userId: user.id, adId, adTitle: `${ad.positionSought} — ${ad.teamName}`,
      teamName: ad?.teamName || 'Équipe Footera', applicantName: user?.name || 'Joueur Footera',
      applicantPosition: user?.sportsCv?.primaryPosition || 'Joueur', phone: input.phone || user?.phone || '',
      message: input.message, submittedAt: new Date().toISOString(), status: 'EN_REVUE',
    };
    await this.records.create('applications', id, application);
    await this.records.save('recruitmentAds', adId, { ...ad, candidatesCount: Number(ad.candidatesCount || 0) + 1 });
    try {
      await this.notifications.add({ title: 'Candidature transmise', message: `Votre candidature pour ${application.teamName} a été envoyée avec succès.`, type: 'recruitment', targetSection: 'recruitment', targetId: adId });
    } catch (error: unknown) {
      this.logger.warn(`Application ${id} was saved, but its notification could not be created: ${String(error)}`);
    }
    return application;
  }
}
