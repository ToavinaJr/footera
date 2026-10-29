import { apiClient } from '../lib/api/client';
import type { NavigationSection } from '../context/navigation';
import type { Match, Application, Booking } from '../types';

export interface DashboardTeam { id: string; name: string; logoUrl: string; city: string; division: string; membersCount: number }
export type DashboardMatch = Pick<Match, 'id' | 'status' | 'date' | 'time' | 'scheduledAt' | 'venue' | 'competition' | 'homeTeam' | 'awayTeam'>;
export interface DashboardActivity { id: string; title: string; description: string; createdAt?: string; targetSection?: NavigationSection; targetId?: string }
export interface DashboardData {
  myTeam: DashboardTeam | null;
  canManageTeam: boolean;
  nextTeamMatch: DashboardMatch | null;
  favoritePlayers: { id: string; name: string; avatarUrl: string; primaryPosition: string; currentTeam: string }[];
  favoriteTeams: DashboardTeam[];
  followedMatches: DashboardMatch[];
  favoriteTournaments: { id: string; title: string; status?: string; city?: string; startDate?: string }[];
  bookings: Pick<Booking, 'id' | 'pitchId' | 'pitchName' | 'date' | 'time' | 'status'>[];
  applications: { id: string; adId: string; title: string; teamName: string; status: Application['status'] }[];
  pendingActions: { applications: number; bookings: number; roles: number };
  personalActivity: DashboardActivity[];
  platformActivity: DashboardActivity[];
}
export const dashboardService = { get: () => apiClient<DashboardData>('dashboard') };
