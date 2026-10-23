import React from 'react';
import { 
  Home, 
  Compass, 
  Trophy, 
  Medal,
  MapPin, 
  ShoppingBag, 
  Settings, 
  X,
  Shield,
  Briefcase,
  BarChart3
} from 'lucide-react';
import { NavigationSection } from '../../context/navigation';
import { useApp } from '../../context/useApp';
import { LanguageSwitcher, useTranslation } from '../../i18n';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
  const { activeSection, setActiveSection, user } = useApp();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const menuItems: { label: string; section: NavigationSection; icon: React.ElementType }[] = [
    { label: t('nav.home'), section: 'home', icon: Home },
    { label: t('nav.players'), section: 'players', icon: Compass },
    { label: t('nav.teamsMatches'), section: 'matches', icon: Trophy },
    { label: t('nav.tournaments'), section: 'tournaments', icon: Medal },
    { label: t('nav.stats'), section: 'stats', icon: BarChart3 },
    { label: t('nav.pitches'), section: 'pitches', icon: MapPin },
    { label: t('nav.marketplace'), section: 'marketplace', icon: ShoppingBag },
    { label: t('nav.recruitment'), section: 'recruitment', icon: Briefcase },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex transition-opacity"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />

      {/* Drawer content: Pitch tactical grid green background from user reference */}
      <div className="sidebar-drawer-panel relative h-dvh max-h-dvh min-h-0 w-72 max-w-[85vw] shrink-0 overflow-y-auto overscroll-contain pitch-tactical-grid border-r border-[#155a36] shadow-2xl flex flex-col justify-between p-5 text-white animate-in slide-in-from-left duration-200">
        <div>
          {/* Header with Footera Brand and Close Button */}
          <div className="flex items-center justify-between pb-6 border-b border-[#144f2f]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-lime-volt flex items-center justify-center font-bold text-pitch-ink shadow-sm">
                <span className="font-display font-extrabold text-lg">F</span>
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-white">
                Footera
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label={t('nav.closeMenu')}
              className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-[#124227] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav aria-label={t('nav.sidebar')} className="mt-6 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSection === item.section ||
                (item.label === 'Explorer' && (activeSection === 'players' || activeSection === 'teams'));

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveSection(item.section);
                    onClose();
                  }}
                  className={`w-full min-h-11.5 px-3.5 py-2.5 rounded-2xl flex items-center gap-3.5 text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-lime-volt text-pitch-ink shadow-md shadow-lime-volt/10 font-bold'
                      : 'text-slate-200 hover:bg-[#0f4427] hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-pitch-ink' : 'text-slate-300'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User shortcut at the bottom */}
        <div className="pt-4 border-t border-[#144f2f] flex flex-col gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => {
              setActiveSection('profile');
              onClose();
            }}
            className="flex items-center gap-3 text-left w-full hover:bg-[#0f4427] p-2 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-lime-volt flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                'N'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">{user?.name}</span>
              <span className="text-caption text-lime-volt block truncate">{user?.sportsCv.currentTeam}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
