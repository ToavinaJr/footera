import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { Player, Position } from '../types';

export interface PlayerFilters {
  query?: string;
  position?: Position | 'Toutes';
  city?: string;
  level?: string;
  transferOnly?: boolean;
}

export const playersService = {
  async list(filters?: PlayerFilters): Promise<Player[]> {
    if (IS_MOCK_MODE) {
      let players = mockStorage.getPlayers();
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        players = players.filter((p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q));
      }
      if (filters?.position && filters.position !== 'Toutes') {
        players = players.filter((p) => p.primaryPosition === filters.position || p.secondaryPosition === filters.position);
      }
      if (filters?.city && filters.city !== 'Toutes') {
        players = players.filter((p) => p.city.toLowerCase() === filters.city?.toLowerCase());
      }
      if (filters?.level && filters.level !== 'Tous') {
        players = players.filter((p) => p.level === filters.level);
      }
      if (filters?.transferOnly) {
        players = players.filter((p) => p.isAvailableForTransfer);
      }
      return mockDelay(players, 250);
    }
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    if (filters?.position && filters.position !== 'Toutes') params.set('position', filters.position);
    if (filters?.city && filters.city !== 'Toutes') params.set('city', filters.city);
    if (filters?.level && filters.level !== 'Tous') params.set('level', filters.level);
    if (filters?.transferOnly) params.set('transferOnly', 'true');
    return apiClient<Player[]>(`players?${params.toString()}`);
  },

  async getById(id: string): Promise<Player> {
    if (IS_MOCK_MODE) {
      const player = mockStorage.getPlayerById(id);
      if (!player) throw new Error('Joueur introuvable');
      return mockDelay(player, 150);
    }
    return apiClient<Player>(`players/${id}`);
  },
};
