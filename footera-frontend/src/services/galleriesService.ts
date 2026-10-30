import { apiClient } from '../lib/api/client';

export type GalleryEntity = 'players' | 'clubs' | 'pitches' | 'tournaments';
export interface GalleryData { images: string[]; canManage: boolean }

export const galleriesService = {
  get(entity: GalleryEntity, id: string): Promise<GalleryData> {
    return apiClient<GalleryData>(`galleries/${entity}/${encodeURIComponent(id)}`);
  },
  add(entity: GalleryEntity, id: string, imageUrl: string): Promise<Pick<GalleryData, 'images'>> {
    return apiClient(`galleries/${entity}/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ imageUrl }) });
  },
  replace(entity: GalleryEntity, id: string, previousImageUrl: string, imageUrl: string): Promise<Pick<GalleryData, 'images'>> {
    return apiClient(`galleries/${entity}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ previousImageUrl, imageUrl }) });
  },
  remove(entity: GalleryEntity, id: string, imageUrl: string): Promise<Pick<GalleryData, 'images'>> {
    return apiClient(`galleries/${entity}/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({ imageUrl }) });
  },
};
