import { apiClient } from '../lib/api/client';
import type { Application, RecruitmentAd } from '../types';

export const recruitmentService = {
  async listAds(filters?: { query?: string; position?: string; division?: string }): Promise<RecruitmentAd[]> {
    return this.requestAds('recruitment/ads', filters);
  },

  async listAvailableAds(filters?: { query?: string; position?: string; division?: string }): Promise<RecruitmentAd[]> {
    return this.requestAds('recruitment/ads/available', filters);
  },

  requestAds(path: string, filters?: { query?: string; position?: string; division?: string }): Promise<RecruitmentAd[]> {
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    if (filters?.position && filters.position !== 'Tous') params.set('position', filters.position);
    if (filters?.division && filters.division !== 'Toutes') params.set('division', filters.division);
    const query = params.size ? `?${params.toString()}` : '';
    return apiClient<RecruitmentAd[]>(`${path}${query}`);
  },

  getAdById(id: string): Promise<RecruitmentAd> {
    return apiClient<RecruitmentAd>(`recruitment/ads/${encodeURIComponent(id)}`);
  },

  apply(adId: string, applicant: { message: string; phone: string }): Promise<Application> {
    return apiClient<Application>(`recruitment/ads/${encodeURIComponent(adId)}/apply`, { method: 'POST', body: JSON.stringify(applicant) });
  },

  listMyApplications(): Promise<Application[]> {
    return apiClient<Application[]>('recruitment/my-applications');
  },

  cancelApplication(id: string): Promise<Application> {
    return apiClient<Application>(`recruitment/my-applications/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  },
};
