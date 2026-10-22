import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { DemoBanner } from './components/layout/DemoBanner';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/Toast';
import { HomeView } from './components/modules/Home/HomeView';
import { PlayersView } from './components/modules/Players/PlayersView';
import { TeamsView } from './components/modules/Teams/TeamsView';
import { MatchesView } from './components/modules/Matches/MatchesView';
import { TournamentsView } from './components/modules/Tournaments/TournamentsView';
import { PitchesView } from './components/modules/Pitches/PitchesView';
import { RecruitmentView } from './components/modules/Recruitment/RecruitmentView';
import { MarketplaceView } from './components/modules/Marketplace/MarketplaceView';
import { ProfileView } from './components/modules/Profile/ProfileView';
import { StatsView } from './components/modules/Stats/StatsView';

const AppContent: React.FC = () => {
  const { activeSection, setActiveSection } = useApp();

  const renderActiveView = () => {
    switch (activeSection) {
      case 'home':
        return <HomeView />;
      case 'players':
        return <PlayersView />;
      case 'teams':
        return <TeamsView />;
      case 'matches':
        return <MatchesView />;
      case 'tournaments':
        return <TournamentsView />;
      case 'pitches':
        return <PitchesView />;
      case 'recruitment':
        return <RecruitmentView />;
      case 'marketplace':
        return <MarketplaceView />;
      case 'profile':
        return <ProfileView />;
      case 'stats':
        return <StatsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-[#f5f8f4] text-[#12281e] font-sans selection:bg-[#c6f432] selection:text-[#092c1a]">
      {/* Discreet Demo / Data Mode Banner */}
      <DemoBanner />

      {/* Top Navigation Bar */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-16">
        {renderActiveView()}
      </main>

      {/* Mobile Ergonomic Bottom Tab Navigation */}
      <MobileNav />

      {/* Global Notifications and Mutation Feedback Toasts */}
      <ToastContainer />

      {/* Footer */}
      <footer className="border-t border-[#e2ebe0] bg-white py-8 px-4 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#0e5632] flex items-center justify-center font-bold text-[#c6f432] text-xs">
              F
            </div>
            <span className="font-extrabold text-[#092c1a]">FOOTERA</span>
            <span>— Plateforme unifiée de l&apos;écosystème footballistique</span>
          </div>
          <div className="flex items-center gap-5 text-slate-500 font-medium">
            <button onClick={() => setActiveSection('players')} className="hover:text-[#0e5632] cursor-pointer">
              Joueurs
            </button>
            <button onClick={() => setActiveSection('teams')} className="hover:text-[#0e5632] cursor-pointer">
              Équipes
            </button>
            <button onClick={() => setActiveSection('matches')} className="hover:text-[#0e5632] cursor-pointer">
              Matchs
            </button>
            <button onClick={() => setActiveSection('stats')} className="hover:text-[#0e5632] cursor-pointer font-bold text-[#0e5632]">
              Stats & Buteurs
            </button>
            <button onClick={() => setActiveSection('pitches')} className="hover:text-[#0e5632] cursor-pointer">
              Terrains
            </button>
            <button onClick={() => setActiveSection('marketplace')} className="hover:text-[#0e5632] cursor-pointer">
              Marketplace
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
