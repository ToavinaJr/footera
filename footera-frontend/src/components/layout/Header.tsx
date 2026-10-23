import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, User, X, BarChart3, LogOut } from 'lucide-react';
import { NavigationSection } from '../../context/navigation';
import { useApp } from '../../context/useApp';
import { NotificationsDrawer } from './NotificationsDrawer';
import { SidebarDrawer } from './SidebarDrawer';

export const Header: React.FC = () => {
  const { activeSection, setActiveSection, unreadNotificationsCount, user, logout, showToast } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isNotifOpen = location.pathname === '/notifications';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const openNotifications = () => {
    if (!isNotifOpen) {
      navigate('/notifications', { state: { backgroundLocation: location } });
    }
  };

  const closeNotifications = () => {
    const hasBackgroundRoute = Boolean(
      (location.state as { backgroundLocation?: unknown } | null)?.backgroundLocation,
    );
    if (hasBackgroundRoute) navigate(-1);
    else navigate('/', { replace: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      setActiveSection('players');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e5ece2] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Hamburger menu + Brand (Desktop) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Ouvrir le menu de navigation"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-[#0d3822] hover:bg-pitch-light transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            <button
              onClick={() => setActiveSection('home')}
              className="hidden sm:flex items-center gap-2 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-pitch-primary flex items-center justify-center font-bold text-lime-volt shadow-xs">
                <span className="font-display font-extrabold text-base">F</span>
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-pitch-ink">
                Footera
              </span>
            </button>
          </div>

          {/* Center: Search pill bar matching Screenshot 2 & 3 */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-md relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Rechercher un joueur, une équipe..."
              className="w-full bg-[#f4f7f2] border border-pitch-line focus:border-pitch-primary focus:bg-white rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-pitch-ink placeholder:text-slate-400 transition-all outline-hidden"
            />
            {headerSearch && (
              <button
                type="button"
                onClick={() => setHeaderSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Right: Stats Shortcut + Notifications Bell + User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveSection('stats')}
              aria-label="Statistiques & Buteurs"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'stats'
                  ? 'bg-pitch-primary text-white shadow-xs'
                  : 'bg-[#f4f7f2] hover:bg-pitch-light text-pitch-ink border border-pitch-line'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeSection === 'stats' ? 'text-white' : 'text-pitch-primary'}`} />
              <span>Stats & Buteurs</span>
            </button>

            {/* Notification Trigger with Red Badge */}
            <button
              onClick={openNotifications}
              aria-label={`Notifications (${unreadNotificationsCount} non lues)`}
              className="relative min-h-11 min-w-11 flex items-center justify-center rounded-full text-[#0d3822] hover:bg-pitch-light transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 stroke-[2.2]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#dc2626] text-white text-micro font-extrabold flex items-center justify-center ring-2 ring-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Profile Avatar with Green Jersey */}
            <button
              onClick={() => setActiveSection('profile')}
              aria-label="Accéder à mon espace personnel"
              className="w-10 h-10 rounded-full border-2 border-pitch-primary overflow-hidden hover:ring-2 hover:ring-lime-volt transition-all cursor-pointer shrink-0"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-[#0d3822] flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => void logout().catch((error: unknown) => showToast(error instanceof Error ? error.message : 'La déconnexion a échoué.', 'error'))}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Side Tactical Grid Drawer */}
      <SidebarDrawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Notifications Drawer */}
      <NotificationsDrawer isOpen={isNotifOpen} onClose={closeNotifications} />
    </>
  );
};
