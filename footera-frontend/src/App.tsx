import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Header } from './components/layout/Header';
import { DemoBanner } from './components/layout/DemoBanner';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/Toast';

const HomeView = lazy(() => import('./components/modules/Home/HomeView').then((module) => ({ default: module.HomeView })));
const PlayersView = lazy(() => import('./components/modules/Players/PlayersView').then((module) => ({ default: module.PlayersView })));
const TeamsView = lazy(() => import('./components/modules/Teams/TeamsView').then((module) => ({ default: module.TeamsView })));
const TeamDetailView = lazy(() => import('./components/modules/Teams/TeamDetailView').then((module) => ({ default: module.TeamDetailView })));
const MatchesView = lazy(() => import('./components/modules/Matches/MatchesView').then((module) => ({ default: module.MatchesView })));
const TournamentsView = lazy(() => import('./components/modules/Tournaments/TournamentsView').then((module) => ({ default: module.TournamentsView })));
const PitchesView = lazy(() => import('./components/modules/Pitches/PitchesView').then((module) => ({ default: module.PitchesView })));
const RecruitmentView = lazy(() => import('./components/modules/Recruitment/RecruitmentView').then((module) => ({ default: module.RecruitmentView })));
const MarketplaceView = lazy(() => import('./components/modules/Marketplace/MarketplaceView').then((module) => ({ default: module.MarketplaceView })));
const ProfileView = lazy(() => import('./components/modules/Profile/ProfileView').then((module) => ({ default: module.ProfileView })));
const StatsView = lazy(() => import('./components/modules/Stats/StatsView').then((module) => ({ default: module.StatsView })));

const LegacyPlayerRedirect: React.FC = () => {
  const { playerId = '' } = useParams();
  return <Navigate to={`/profile/${encodeURIComponent(playerId)}`} replace />;
};

const AppContent: React.FC = () => {
  const { setActiveSection } = useApp();
  const location = useLocation();
  const backgroundLocation = (location.state as { backgroundLocation?: typeof location } | null)?.backgroundLocation;

  return (
    <div className="min-h-full flex flex-col bg-canvas-bg text-[#12281e] font-sans selection:bg-lime-volt selection:text-pitch-ink">
      {/* Discreet Demo / Data Mode Banner */}
      <DemoBanner />

      {/* Top Navigation Bar */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-16">
        <Suspense fallback={<div className="py-16 text-center text-sm text-slate-500">Chargement de la page…</div>}>
        <Routes location={backgroundLocation ?? location}>
          <Route path="/" element={<HomeView />} />
          <Route path="/players" element={<PlayersView />} />
          <Route path="/players/:playerId" element={<PlayersView />} />
          <Route path="/profile/:profileId" element={<ProfileView />} />
          <Route path="/player/:playerId" element={<LegacyPlayerRedirect />} />
          <Route path="/teams" element={<TeamsView />} />
          <Route path="/teams/:teamId" element={<TeamDetailView />} />
          <Route path="/matches" element={<MatchesView />} />
          <Route path="/matches/:matchId" element={<MatchesView />} />
          <Route path="/tournaments" element={<TournamentsView />} />
          <Route path="/tournaments/new" element={<TournamentsView />} />
          <Route path="/tournaments/:tournamentId" element={<TournamentsView />} />
          <Route path="/pitches" element={<PitchesView />} />
          <Route path="/pitches/:pitchId/book" element={<PitchesView />} />
          <Route path="/pitches/:pitchId" element={<PitchesView />} />
          <Route path="/recruitment" element={<RecruitmentView />} />
          <Route path="/marketplace" element={<MarketplaceView />} />
          <Route path="/marketplace/new" element={<MarketplaceView />} />
          <Route path="/marketplace/:listingId" element={<MarketplaceView />} />
          <Route path="/pitches/new" element={<PitchesView />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/profile/edit-cv" element={<ProfileView />} />
          <Route path="/profile/bookings" element={<ProfileView />} />
          <Route path="/profile/bookings/:bookingId" element={<ProfileView />} />
          <Route path="/profile/applications" element={<ProfileView />} />
          <Route path="/notifications" element={<HomeView />} />
          <Route path="/stats" element={<StatsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>

      {/* Mobile Ergonomic Bottom Tab Navigation */}
      <MobileNav />

      {/* Global Notifications and Mutation Feedback Toasts */}
      <ToastContainer />

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-white py-8 px-4 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-pitch-primary flex items-center justify-center font-bold text-lime-volt text-xs">
              F
            </div>
            <span className="font-extrabold text-pitch-ink">FOOTERA</span>
            <span>— Plateforme unifiée de l&apos;écosystème footballistique</span>
          </div>
          <div className="flex items-center gap-5 text-slate-500 font-medium">
            <button onClick={() => setActiveSection('players')} className="hover:text-pitch-primary cursor-pointer">
              Joueurs
            </button>
            <button onClick={() => setActiveSection('teams')} className="hover:text-pitch-primary cursor-pointer">
              Équipes
            </button>
            <button onClick={() => setActiveSection('matches')} className="hover:text-pitch-primary cursor-pointer">
              Matchs
            </button>
            <button onClick={() => setActiveSection('stats')} className="hover:text-pitch-primary cursor-pointer font-bold text-pitch-primary">
              Stats & Buteurs
            </button>
            <button onClick={() => setActiveSection('pitches')} className="hover:text-pitch-primary cursor-pointer">
              Terrains
            </button>
            <button onClick={() => setActiveSection('marketplace')} className="hover:text-pitch-primary cursor-pointer">
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
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
