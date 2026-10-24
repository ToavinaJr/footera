import { apiClient } from '../lib/api/client';
import type { Player, Position, TeamInvitation } from '../types';

export interface PlayerOptions {
  positions: string[];
  levels: string[];
}

export interface PlayerFilters {
  query?: string;
  position?: Position | 'Toutes';
  city?: string;
  level?: string;
  transferOnly?: boolean;
}

export const playersService = {
  options(): Promise<PlayerOptions> {
    return apiClient<PlayerOptions>('players/options');
  },

  async list(filters?: PlayerFilters): Promise<Player[]> {
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    if (filters?.position && filters.position !== 'Toutes') params.set('position', filters.position);
    if (filters?.city && filters.city !== 'Toutes') params.set('city', filters.city);
    if (filters?.level && filters.level !== 'Tous') params.set('level', filters.level);
    if (filters?.transferOnly) params.set('transferOnly', 'true');
    return apiClient<Player[]>(`players?${params.toString()}`);
  },

  getById(id: string): Promise<Player> {
    return apiClient<Player>(`players/${encodeURIComponent(id)}`);
  },

  getMine(): Promise<Player> {
    return apiClient<Player>('players/me');
  },

  getMatchStats(id: string, competitionId?: string): Promise<{
    appearances: number;
    minutesPlayed: number | null;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    teamStats: Array<{ teamId: string; appearances: number; minutesPlayed: number | null; goals: number; assists: number; yellowCards: number; redCards: number }>;
  }> {
    const params = new URLSearchParams();
    if (competitionId) params.set('competitionId', competitionId);
    const query = params.size ? `?${params.toString()}` : '';
    return apiClient(`players/${encodeURIComponent(id)}/stats${query}`);
  },

  invite(id: string, message: string): Promise<{ success: boolean; invitation: TeamInvitation; message: string }> {
    return apiClient(`players/${encodeURIComponent(id)}/invite`, { method: 'POST', body: JSON.stringify({ message }) });
  },
};
