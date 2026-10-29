import { createContext } from 'react';
import type { NotificationItem, UserProfile, UserRole } from '../types';
import type { NavigationSection } from './navigation';
import type { FavoriteEntity } from '../services/favoritesService';

export type { NavigationSection } from './navigation';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

export interface AppContextType {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  selectedResourceId?: string;
  navigateToResource: (section: NavigationSection, resourceId?: string) => void;
  user: UserProfile | null;
  isLoadingUser: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<boolean>;
  updateSportsCv: (cv: Partial<UserProfile['sportsCv']>) => Promise<boolean>;
  toggleFavoriteTeam: (teamId: string) => Promise<boolean>;
  setFavorite: (entity: FavoriteEntity, id: string, favorite: boolean) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  notifications: NotificationItem[];
  refreshNotifications: () => Promise<void>;
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  resetDemo: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
