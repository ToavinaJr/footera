import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, UserRole, NotificationItem } from '../types';
import { authService } from '../services/authService';
import { notificationsService } from '../services/notificationsService';
import { mockStorage } from '../mocks/mockStorage';

export type NavigationSection =
  | 'home'
  | 'players'
  | 'teams'
  | 'matches'
  | 'tournaments'
  | 'pitches'
  | 'recruitment'
  | 'marketplace'
  | 'profile'
  | 'stats';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

interface AppContextType {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  selectedResourceId?: string;
  navigateToResource: (section: NavigationSection, resourceId?: string) => void;
  
  user: UserProfile | null;
  isLoadingUser: boolean;
  switchRole: (role: UserRole) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  updateSportsCv: (cv: Partial<UserProfile['sportsCv']>) => Promise<void>;
  toggleFavoriteTeam: (teamId: string) => Promise<boolean>;

  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;

  resetDemo: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<NavigationSection>('home');
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const fetchUserData = useCallback(async () => {
    try {
      const u = await authService.getProfile();
      setUser(u);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load user profile:', e);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const notifs = await notificationsService.list();
      setNotifications(notifs);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load notifications:', e);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchNotifications();

    // Subscribe to mock storage mutations for real-time reactivity
    const unsubscribe = mockStorage.subscribe(() => {
      fetchUserData();
      fetchNotifications();
    });

    return () => unsubscribe();
  }, [fetchUserData, fetchNotifications]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigateToResource = useCallback((section: NavigationSection, resourceId?: string) => {
    setActiveSection(section);
    setSelectedResourceId(resourceId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const switchRole = async (role: UserRole) => {
    try {
      const updated = await authService.switchRole(role);
      setUser(updated);
      showToast(`Rôle actif changé : ${role}`);
    } catch (e: any) {
      showToast(e.message || 'Erreur lors du changement de rôle', 'error');
    }
  };

  const updateProfile = async (partial: Partial<UserProfile>) => {
    try {
      const updated = await authService.updateProfile(partial);
      setUser(updated);
      showToast('Profil mis à jour avec succès');
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const updateSportsCv = async (cv: Partial<UserProfile['sportsCv']>) => {
    try {
      const updated = await authService.updateSportsCv(cv);
      setUser(updated);
      showToast('CV Sportif enregistré');
    } catch (e: any) {
      showToast(e.message || 'Erreur de sauvegarde', 'error');
    }
  };

  const toggleFavoriteTeam = async (teamId: string): Promise<boolean> => {
    const isFav = await authService.toggleFavoriteTeam(teamId);
    if (user) {
      setUser({
        ...user,
        favoriteTeamIds: isFav
          ? [...user.favoriteTeamIds, teamId]
          : user.favoriteTeamIds.filter((id) => id !== teamId),
      });
    }
    showToast(isFav ? 'Équipe ajoutée aux favoris' : 'Équipe retirée des favoris');
    return isFav;
  };

  const markNotificationRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = async () => {
    await notificationsService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Toutes les notifications sont marquées comme lues');
  };

  const resetDemo = async () => {
    await authService.resetDemoData();
    await fetchUserData();
    await fetchNotifications();
    showToast('Données de démonstration réinitialisées à l’état initial', 'info');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        activeSection,
        setActiveSection,
        selectedResourceId,
        navigateToResource,
        user,
        isLoadingUser,
        switchRole,
        updateProfile,
        updateSportsCv,
        toggleFavoriteTeam,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        toasts,
        showToast,
        removeToast,
        resetDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
