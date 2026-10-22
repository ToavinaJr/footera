import React from 'react';
import { 
  Home, 
  Compass, 
  Trophy, 
  MapPin, 
  ShoppingBag, 
  Bell, 
  Settings, 
  X,
  Shield,
  Briefcase,
  BarChart3
} from 'lucide-react';
import { useApp, NavigationSection } from '../../context/AppContext';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
  const { activeSection, setActiveSection, unreadNotificationsCount, user } = useApp();

  if (!isOpen) return null;

  const menuItems: { label: string; section: NavigationSection; icon: React.ElementType }[] = [
    { label: 'Accueil', section: 'home', icon: Home },
    { label: 'Explorer', section: 'players', icon: Compass },
    { label: 'Matchs et compétitions', section: 'matches', icon: Trophy },
    { label: 'Statistiques & Buteurs', section: 'stats', icon: BarChart3 },
    { label: 'Terrains', section: 'pitches', icon: MapPin },
    { label: 'Marketplace', section: 'marketplace', icon: ShoppingBag },
    { label: 'Mercato & Recrutement', section: 'recruitment', icon: Briefcase },
    { label: 'Notifications', section: 'matches', icon: Bell },
    { label: 'Paramètres & Profil', section: 'profile', icon: Settings },
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
      <div className="relative w-72 max-w-[85vw] h-full pitch-tactical-grid border-r border-[#155a36] shadow-2xl flex flex-col justify-between p-5 text-white animate-in slide-in-from-left duration-200">
        <div>
          {/* Header with Footera Brand and Close Button */}
          <div className="flex items-center justify-between pb-6 border-b border-[#144f2f]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#c6f432] flex items-center justify-center font-bold text-[#092c1a] shadow-sm">
                <span className="font-display font-extrabold text-lg">F</span>
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-white">
                Footera
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer le menu"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-[#124227] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Menu latéral Footera" className="mt-6 space-y-1.5">
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
                  className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center gap-3.5 text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#c6f432] text-[#092c1a] shadow-md shadow-[#c6f432]/10 font-bold'
                      : 'text-slate-200 hover:bg-[#0f4427] hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#092c1a]' : 'text-slate-300'}`} />
                  <span className="truncate">{item.label}</span>
                  {item.label === 'Notifications' && unreadNotificationsCount > 0 && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User shortcut at the bottom */}
        <div className="pt-4 border-t border-[#144f2f] flex items-center justify-between">
          <button
            onClick={() => {
              setActiveSection('profile');
              onClose();
            }}
            className="flex items-center gap-3 text-left w-full hover:bg-[#0f4427] p-2 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-[#c6f432] flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
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
              <span className="text-[11px] text-[#c6f432] block truncate">{user?.sportsCv.currentTeam}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
