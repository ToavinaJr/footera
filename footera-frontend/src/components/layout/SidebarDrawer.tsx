import React from 'react';
import {
  Home, Compass, Trophy, Medal, MapPin, ShoppingBag, X, Briefcase, BarChart3, PanelLeftClose, PanelLeftOpen, Users, Settings,
} from 'lucide-react';
import { NavigationSection } from '../../context/navigation';
import { useApp } from '../../context/useApp';
import { useTranslation } from '../../i18n';

interface SidebarDrawerProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, isCollapsed, onToggleCollapsed, onClose }) => {
  const { activeSection, setActiveSection, user } = useApp();
  const { t } = useTranslation();
  const menuItems: { label: string; section: NavigationSection; icon: React.ElementType }[] = [
    { label: t('nav.home'), section: 'home', icon: Home },
    { label: t('nav.matches'), section: 'matches', icon: Trophy },
    { label: t('nav.teamsOnly'), section: 'teams', icon: Users },
    { label: t('nav.tournaments'), section: 'tournaments', icon: Medal },
    { label: t('nav.players'), section: 'players', icon: Compass },
    { label: t('nav.marketplace'), section: 'marketplace', icon: ShoppingBag },
    { label: t('nav.pitches'), section: 'pitches', icon: MapPin },
    { label: t('nav.mercato'), section: 'mercato', icon: Briefcase },
    { label: t('nav.stats'), section: 'stats', icon: BarChart3 },
    { label: t('nav.settings'), section: 'settings', icon: Settings },
  ];

  const content = (collapsed: boolean, mobile = false) => (
    <div className="pitch-tactical-grid flex h-full min-h-0 flex-col text-white">
      <div className={`flex shrink-0 items-center border-b border-pitch-sidebar-line ${mobile ? 'justify-between px-4' : 'justify-center px-2'} py-3`}>
        {mobile ? (
          <>
            <button
              type="button"
              onClick={() => { setActiveSection('home'); onClose(); }}
              title="Footera"
              className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-lime-volt focus-visible:outline-offset-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-volt font-display text-lg font-extrabold text-pitch-ink">F</span>
              <span className="font-display text-xl font-extrabold tracking-tight">Footera</span>
            </button>
            <button type="button" onClick={onClose} aria-label={t('nav.closeMenu')} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-pitch-sidebar-hover hover:text-white focus-visible:outline-2 focus-visible:outline-lime-volt focus-visible:outline-offset-2">
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button type="button" onClick={onToggleCollapsed} aria-label={collapsed ? t('nav.open') : t('nav.closeMenu')} title={collapsed ? t('nav.open') : t('nav.closeMenu')} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-pitch-sidebar-hover hover:text-white focus-visible:outline-2 focus-visible:outline-lime-volt focus-visible:outline-offset-2">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav aria-label={t('nav.sidebar')} className={`min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain py-4 ${collapsed && !mobile ? 'px-2' : 'px-3'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.section;
          return (
            <button
              key={item.section}
              type="button"
              title={collapsed && !mobile ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => { setActiveSection(item.section); if (mobile) onClose(); }}
              className={`flex min-h-11 w-full cursor-pointer items-center rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${collapsed && !mobile ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-lime-volt text-pitch-ink shadow-md shadow-lime-volt/10' : 'text-slate-200 hover:bg-pitch-sidebar-hover hover:text-white'} focus-visible:outline-2 focus-visible:outline-lime-volt focus-visible:outline-offset-2`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-pitch-ink' : 'text-slate-300'}`} />
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => { setActiveSection('profile'); if (mobile) onClose(); }}
        title={collapsed && !mobile ? user?.name : undefined}
        aria-label={collapsed && !mobile ? (user?.name ?? t('nav.profile')) : undefined}
        aria-current={activeSection === 'profile' ? 'page' : undefined}
        className={`flex shrink-0 items-center border-t border-pitch-sidebar-line py-3 text-left transition-colors hover:bg-pitch-sidebar-hover ${collapsed && !mobile ? 'justify-center px-2' : 'gap-3 px-4'} focus-visible:outline-2 focus-visible:outline-lime-volt focus-visible:outline-offset-2`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-lime-volt bg-slate-900 text-xs font-bold text-white">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : (user?.name?.charAt(0) || 'U')}
        </span>
        {(!collapsed || mobile) && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-white">{user?.name}</span>
            <span className="block truncate text-caption text-lime-volt">{user?.sportsCv.currentTeam || t('nav.profile')}</span>
          </span>
        )}
      </button>
    </div>
  );

  return (
    <>
      <aside className={`sidebar-desktop sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 overflow-hidden border-r border-pitch-sidebar-border shadow-xl transition-[width] duration-200 md:block ${isCollapsed ? 'w-16' : 'w-64'}`}>
        {content(isCollapsed)}
      </aside>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs md:hidden" role="dialog" aria-modal="true" aria-label={t('nav.sidebar')} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          <aside className="sidebar-drawer-panel h-dvh max-h-dvh min-h-0 w-72 max-w-[85vw] shrink-0 overflow-hidden border-r border-pitch-sidebar-border shadow-2xl animate-in slide-in-from-left duration-200">
            {content(false, true)}
          </aside>
        </div>
      )}
    </>
  );
};
