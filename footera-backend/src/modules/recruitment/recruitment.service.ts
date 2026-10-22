import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';

@Injectable()
export class RecruitmentService {
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService, private readonly notifications: NotificationsService) {}
  async listAds(filters: { query?: string; position?: string; division?: string } = {}) {
    const ads = await this.records.list<any>('recruitmentAds');
    return ads.filter((ad) => (!filters.query || `${ad.teamName} ${ad.city} ${ad.description}`.toLowerCase().includes(filters.query.toLowerCase()))
      && (!filters.position || filters.position === 'Tous' || ad.positionSought === filters.position)
      && (!filters.division || filters.division === 'Toutes' || ad.division === filters.division));
  }
  getAd(id: string) { return this.records.find('recruitmentAds', id); }
  async listApplications() { return (await this.records.list<any>('applications')).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)); }
  async apply(adId: string, input: { message: string; phone: string }) {
    const [ad, user]: any[] = await Promise.all([this.getAd(adId), this.accounts.profile()]);
    const id = `app_${randomUUID()}`;
    const application = {
      id, adId, adTitle: ad ? `${ad.positionSought} — ${ad.teamName}` : 'Candidature Footera',
      teamName: ad?.teamName || 'Équipe Footera', applicantName: user?.name || 'Joueur Footera',
      applicantPosition: user?.sportsCv?.primaryPosition || 'Joueur', phone: input.phone || user?.phone || '',
      message: input.message, submittedAt: new Date().toISOString(), status: 'EN_REVUE',
    };
    await this.records.create('applications', id, application);
    if (ad) await this.records.save('recruitmentAds', adId, { ...ad, candidatesCount: Number(ad.candidatesCount || 0) + 1 });
    await this.notifications.add({ title: 'Candidature transmise', message: `Votre candidature pour ${application.teamName} a été envoyée avec succès.`, type: 'recruitment', targetSection: 'recruitment', targetId: adId });
    return application;
  }
}
