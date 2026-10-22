import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { RecruitmentAd, Application } from '../types';

export const recruitmentService = {
  async listAds(filters?: { query?: string; position?: string; division?: string }): Promise<RecruitmentAd[]> {
    if (IS_MOCK_MODE) {
      let ads = mockStorage.getRecruitmentAds();
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        ads = ads.filter((a) => a.teamName.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
      }
      if (filters?.position && filters.position !== 'Tous') {
        ads = ads.filter((a) => a.positionSought === filters.position);
      }
      return mockDelay(ads, 200);
    }
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    if (filters?.position && filters.position !== 'Tous') params.set('position', filters.position);
    if (filters?.division && filters.division !== 'Toutes') params.set('division', filters.division);
    return apiClient<RecruitmentAd[]>(`recruitment/ads?${params.toString()}`);
  },

  async getAdById(id: string): Promise<RecruitmentAd> {
    if (IS_MOCK_MODE) {
      const ad = mockStorage.getRecruitmentAdById(id);
      if (!ad) throw new Error('Annonce introuvable');
      return mockDelay(ad, 150);
    }
    return apiClient<RecruitmentAd>(`recruitment/ads/${id}`);
  },

  async apply(adId: string, applicant: { message: string; phone: string }): Promise<Application> {
    if (IS_MOCK_MODE) {
      const app = mockStorage.applyToRecruitment(adId, applicant);
      return mockDelay(app, 400);
    }
    return apiClient<Application>(`recruitment/ads/${adId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicant),
    });
  },

  async listMyApplications(): Promise<Application[]> {
    if (IS_MOCK_MODE) {
      return mockDelay(mockStorage.getApplications(), 200);
    }
    return apiClient<Application[]>('recruitment/my-applications');
  },
};
