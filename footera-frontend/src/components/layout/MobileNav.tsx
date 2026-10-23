import React from 'react';
import { Home, Compass, Trophy, User } from 'lucide-react';
import { NavigationSection } from '../../context/navigation';
import { useApp } from '../../context/useApp';

export const MobileNav: React.FC = () => {
  const { activeSection, setActiveSection } = useApp();

  const tabs: { label: string; section: NavigationSection; icon: React.ElementType }[] = [
    { label: 'Accueil', section: 'home', icon: Home },
    { label: 'Joueurs', section: 'players', icon: Compass },
    { label: 'Matchs', section: 'matches', icon: Trophy },
    { label: 'Profil', section: 'profile', icon: User },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border-subtle shadow-lg"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center">
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
              className={`flex flex-col items-center justify-center min-h-12 py-1 transition-all cursor-pointer relative ${
                isActive ? 'text-pitch-ink font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`flex items-center justify-center px-4 py-1 rounded-full transition-all ${
                  isActive
                    ? 'bg-lime-volt text-pitch-ink shadow-xs'
                    : 'bg-transparent text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className={`text-micro mt-0.5 tracking-tight ${isActive ? 'font-bold text-pitch-ink' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
