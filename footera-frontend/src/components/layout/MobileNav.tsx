import React from 'react';
import { Home, Compass, Trophy, Bell, User } from 'lucide-react';
import { useApp, NavigationSection } from '../../context/AppContext';

export const MobileNav: React.FC = () => {
  const { activeSection, setActiveSection, unreadNotificationsCount } = useApp();

  const tabs: { label: string; section: NavigationSection; icon: React.ElementType }[] = [
    { label: 'Accueil', section: 'home', icon: Home },
    { label: 'Explorer', section: 'players', icon: Compass },
    { label: 'Matchs', section: 'matches', icon: Trophy },
    { label: 'Alertes', section: 'matches', icon: Bell },
    { label: 'Profil', section: 'profile', icon: User },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2ebe0] shadow-lg"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeSection === tab.section ||
            (tab.label === 'Explorer' && (activeSection === 'players' || activeSection === 'teams'));

          return (
            <button
              key={tab.label}
              onClick={() => {
                setActiveSection(tab.section);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all cursor-pointer relative ${
                isActive ? 'text-[#092c1a] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`flex items-center justify-center px-4 py-1 rounded-full transition-all ${
                  isActive
                    ? 'bg-[#c6f432] text-[#092c1a] shadow-xs'
                    : 'bg-transparent text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-[#092c1a]' : 'font-medium'}`}>
                {tab.label}
              </span>
              {tab.label === 'Alertes' && unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
