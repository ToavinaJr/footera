import { createContext } from 'react';
import type { NotificationItem, UserProfile, UserRole } from '../types';
import type { NavigationSection } from './navigation';

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
  switchRole: (role: UserRole) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  updateSportsCv: (cv: Partial<UserProfile['sportsCv']>) => Promise<boolean>;
  toggleFavoriteTeam: (teamId: string) => Promise<boolean>;
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
