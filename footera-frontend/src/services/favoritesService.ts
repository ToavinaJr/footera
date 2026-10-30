import { apiClient } from '../lib/api/client';
export type FavoriteEntity = 'players' | 'teams' | 'matches' | 'tournaments';
export const favoriteFields = { players: 'favoritePlayerIds', teams: 'favoriteTeamIds', matches: 'favoriteMatchIds', tournaments: 'favoriteTournamentIds' } as const;
export const favoritesService = {
  set(entity: FavoriteEntity, id: string, favorite: boolean) {
    return apiClient<{ isFavorite: boolean }>(`favorites/${entity}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ favorite }) });
  },
};
