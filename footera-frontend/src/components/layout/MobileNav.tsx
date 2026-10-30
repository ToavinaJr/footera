import React from 'react';
import { Home, Compass, Trophy, User } from 'lucide-react';
import { NavigationSection } from '../../context/navigation';
import { useApp } from '../../context/useApp';
import { useTranslation } from '../../i18n';

export const MobileNav: React.FC = () => {
  const { activeSection, setActiveSection } = useApp();
  const { t } = useTranslation();

  const tabs: { label: string; section: NavigationSection; icon: React.ElementType }[] = [
    { label: t('nav.home'), section: 'home', icon: Home },
    { label: t('nav.players'), section: 'players', icon: Compass },
    { label: t('nav.matches'), section: 'matches', icon: Trophy },
    { label: t('nav.settings'), section: 'settings', icon: User },
  ];

  return (
    <nav
      aria-label={t('nav.mobile')}
      className="header-glass lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle shadow-lg"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.section;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setActiveSection(tab.section);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative flex min-h-12 cursor-pointer flex-col items-center justify-center py-1 transition-colors focus-visible:outline-2 focus-visible:outline-pitch-primary focus-visible:outline-offset-2 ${
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
