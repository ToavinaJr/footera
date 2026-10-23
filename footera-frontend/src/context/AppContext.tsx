import React, { useEffect, useState, useCallback } from 'react';
import type { NotificationItem, UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';
import { notificationsService } from '../services/notificationsService';
import { mockStorage } from '../mocks/mockStorage';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from './app-context';
import type { AppContextType, ToastMessage } from './app-context';
import type { NavigationSection } from './navigation';

const routeForSection = (section: NavigationSection) => {
  if (section === 'home') return '/';
  if (section === 'bookings') return '/profile/bookings';
  return `/${section}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeSection = location.pathname.split('/').filter(Boolean)[0];
  const sectionFromPath = (routeSection === 'player' ? 'players' : routeSection) as NavigationSection | undefined;
  const validSections: NavigationSection[] = [
    'players', 'teams', 'matches', 'tournaments', 'pitches', 'recruitment', 'marketplace', 'notifications', 'profile', 'stats',
  ];
  const activeSection: NavigationSection = sectionFromPath && validSections.includes(sectionFromPath)
    ? sectionFromPath
    : 'home';
  const routeResourceMatch = location.pathname.match(
    /^\/(?:player|players|teams|pitches|matches|recruitment)\/([^/]+)\/?$|^\/profile\/bookings\/([^/]+)\/?$/,
  );
  const routeResourceId = routeResourceMatch?.[1] ?? routeResourceMatch?.[2];
  const selectedResourceId = routeResourceId
    ? decodeURIComponent(routeResourceId)
    : (location.state as { resourceId?: string } | null)?.resourceId;
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

  const setActiveSection = useCallback((section: NavigationSection) => {
    navigate(routeForSection(section));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  const navigateToResource = useCallback((section: NavigationSection, resourceId?: string) => {
    const supportsDetailRoute = section === 'players'
      || section === 'teams'
      || section === 'pitches'
      || section === 'marketplace'
      || section === 'tournaments'
      || section === 'matches'
      || section === 'recruitment'
      || section === 'bookings';
    let path = routeForSection(section);
    if (resourceId && supportsDetailRoute) {
      path = section === 'players'
        ? `/profile/${encodeURIComponent(resourceId)}`
        : `${path}/${encodeURIComponent(resourceId)}`;
    }
    const navigationState = resourceId && !supportsDetailRoute ? { state: { resourceId } } : undefined;
    navigate(path, navigationState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

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

  const updateSportsCv = async (cv: Partial<UserProfile['sportsCv']>): Promise<boolean> => {
    try {
      const updated = await authService.updateSportsCv(cv);
      setUser(updated);
      showToast('CV Sportif enregistré');
    } catch (e: any) {
      showToast(e.message || 'Erreur de sauvegarde', 'error');
      return false;
    }
    return true;
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
        refreshNotifications: fetchNotifications,
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
