import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  Sparkles, 
  Shield, 
  Users, 
  Award, 
  TrendingUp, 
  Search, 
  Activity, 
  ChevronRight, 
  Flame, 
  CheckCircle2, 
  Filter,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';
import { statsService } from '../../../services/statsService';
import { tournamentsService } from '../../../services/tournamentsService';
import { teamsService } from '../../../services/teamsService';
import { 
  TopScorerItem, 
  TopAssisterItem, 
  TeamStatsItem, 
  PlayerStatsItem, 
  Tournament, 
  Team,
  Position 
} from '../../../types';
import { Badge, FormIndicator } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { useApp } from '../../../context/useApp';

export const StatsView: React.FC = () => {
  const { showToast, navigateToResource } = useApp();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'teams' | 'players'>('scorers');

  // Filters
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerPositionFilter, setPlayerPositionFilter] = useState<string>('Tous');

  // Data
  const [scorers, setScorers] = useState<TopScorerItem[]>([]);
  const [assisters, setAssisters] = useState<TopAssisterItem[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStatsItem[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStatsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedTeamModal, setSelectedTeamModal] = useState<TeamStatsItem | null>(null);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<PlayerStatsItem | null>(null);

  // Load Tournaments & Teams filter options
  useEffect(() => {
    async function loadOptions() {
      try {
        const [tournList, teamList] = await Promise.all([
          tournamentsService.list(),
          teamsService.list(),
        ]);
        setTournaments(tournList);
        setTeams(teamList);
      } catch (err: any) {
        showToast(err.message || 'Erreur lors du chargement des options', 'error');
      }
    }
    loadOptions();
  }, [showToast]);

  // Load stats data based on filters
  useEffect(() => {
    async function loadStatsData() {
      setIsLoading(true);
      try {
        const [scorersData, assistersData, teamStatsData, playersData] = await Promise.all([
          statsService.getTopScorers({
            tournamentId: selectedTournamentId,
            teamId: selectedTeamId,
          }),
          statsService.getTopAssisters({
            tournamentId: selectedTournamentId,
            teamId: selectedTeamId,
          }),
          statsService.getTeamsStats({
            tournamentId: selectedTournamentId,
          }),
          statsService.getPlayersStats({
            teamId: selectedTeamId,
            position: playerPositionFilter as any,
            searchQuery: playerSearchQuery,
          }),
        ]);

        setScorers(scorersData);
        setAssisters(assistersData);
        setTeamStats(teamStatsData);
        setPlayerStats(playersData);
      } catch (err: any) {
        showToast(err.message || 'Erreur lors du chargement des statistiques', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadStatsData();
  }, [selectedTournamentId, selectedTeamId, playerPositionFilter, playerSearchQuery, showToast]);

  const selectedTournamentName =
    selectedTournamentId === 'all'
      ? 'Toutes les compétitions confondues'
      : tournaments.find((t) => t.id === selectedTournamentId)?.title || 'Compétition';

  const selectedTeamName =
    selectedTeamId === 'all'
      ? 'Toutes les équipes'
      : teams.find((t) => t.id === selectedTeamId)?.name || 'Équipe';

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#092c1a] tracking-tight flex items-center gap-2.5">
            <span>Statistiques & Classements</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#c6f432] text-[#092c1a] text-xs font-black tracking-normal">
              PRO
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Classement des meilleurs buteurs, passeurs et métriques approfondies de chaque club et joueur.
          </p>
        </div>

        {/* Global Context Indicators */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-[#dce6d8] px-3.5 py-2 rounded-2xl shadow-2xs self-start md:self-auto">
          <Activity className="w-4 h-4 text-[#0e5632]" />
          <span>Saison 2026 en cours</span>
        </div>
      </div>

      {/* Global Filter Bar: Tournoi & Équipe */}
      <div className="p-4 rounded-3xl bg-white border border-[#dce6d8] shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#0e5632]" />
            <span>Filtrer par Tournoi ou Compétition</span>
          </label>
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-2xl px-3.5 py-2.5 text-xs md:text-sm text-[#092c1a] font-semibold focus:border-[#0e5632] outline-hidden"
          >
            <option value="all">🏆 Toutes les compétitions & championnats</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.format})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#0e5632]" />
            <span>Filtrer par Équipe</span>
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-2xl px-3.5 py-2.5 text-xs md:text-sm text-[#092c1a] font-semibold focus:border-[#0e5632] outline-hidden"
          >
            <option value="all">🛡️ Toutes les équipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('scorers')}
          className={`px-4 py-2.5 min-h-[44px] rounded-2xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'scorers'
              ? 'bg-[#0e5632] text-white shadow-xs'
              : 'bg-white border border-[#dce6d8] text-slate-600 hover:text-[#092c1a]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Meilleurs Buteurs</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px]">
            {scorers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assists')}
          className={`px-4 py-2.5 min-h-[44px] rounded-2xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'assists'
              ? 'bg-[#0e5632] text-white shadow-xs'
              : 'bg-white border border-[#dce6d8] text-slate-600 hover:text-[#092c1a]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Meilleurs Passeurs</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px]">
            {assisters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 min-h-[44px] rounded-2xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'teams'
              ? 'bg-[#0e5632] text-white shadow-xs'
              : 'bg-white border border-[#dce6d8] text-slate-600 hover:text-[#092c1a]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Stats des Équipes</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px]">
            {teamStats.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2.5 min-h-[44px] rounded-2xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'players'
              ? 'bg-[#0e5632] text-white shadow-xs'
              : 'bg-white border border-[#dce6d8] text-slate-600 hover:text-[#092c1a]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Stats des Joueurs</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px]">
            {playerStats.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          {/* TAB 1: MEILLEURS BUTEURS */}
          {activeTab === 'scorers' && (
            <div className="space-y-6">
              {/* Podium Top 3 */}
              {scorers.length >= 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Rank 2 (Silver) */}
                  <div className="order-2 sm:order-1 p-5 rounded-3xl bg-white border border-[#dce6d8] relative shadow-xs flex flex-col justify-between text-center">
                    <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center">
                      2
                    </div>
                    <div>
                      <div className="w-16 h-16 rounded-full mx-auto overflow-hidden bg-slate-100 border-2 border-slate-300 shadow-xs mb-3">
                        <img
                          src={scorers[1].avatarUrl}
                          alt={scorers[1].playerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-extrabold text-[#092c1a] text-sm truncate">
                        {scorers[1].playerName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <img src={scorers[1].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span className="truncate">{scorers[1].teamName}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#edf3ea]">
                      <span className="text-2xl font-black text-[#0e5632] tabular-nums">
                        {scorers[1].goals}
                      </span>
                      <span className="text-xs text-slate-500 block font-semibold">
                        buts en {scorers[1].matchesPlayed} matchs ({scorers[1].ratio} b/m)
                      </span>
                    </div>
                  </div>

                  {/* Rank 1 (Gold) */}
                  <div className="order-1 sm:order-2 p-6 rounded-3xl bg-gradient-to-b from-[#f2faee] to-white border-2 border-[#0e5632] relative shadow-sm flex flex-col justify-between text-center scale-102">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#c6f432] text-[#092c1a] font-extrabold text-[11px] shadow-xs flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-[#092c1a]" />
                      <span>MEILLEUR BUTEUR</span>
                    </div>
                    <div>
                      <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-slate-100 border-3 border-[#0e5632] shadow-md mb-3 mt-2">
                        <img
                          src={scorers[0].avatarUrl}
                          alt={scorers[0].playerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-black text-[#092c1a] text-base truncate">
                        {scorers[0].playerName}
                      </h3>
                      <p className="text-xs font-bold text-[#0e5632] flex items-center justify-center gap-1 mt-0.5">
                        <img src={scorers[0].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span className="truncate">{scorers[0].teamName}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#edf3ea]">
                      <span className="text-3xl font-black text-[#0e5632] tabular-nums">
                        {scorers[0].goals}
                      </span>
                      <span className="text-xs font-bold text-[#092c1a] block">
                        buts en {scorers[0].matchesPlayed} matchs ({scorers[0].ratio} b/m)
                      </span>
                    </div>
                  </div>

                  {/* Rank 3 (Bronze) */}
                  <div className="order-3 p-5 rounded-3xl bg-white border border-[#dce6d8] relative shadow-xs flex flex-col justify-between text-center">
                    <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <div className="w-16 h-16 rounded-full mx-auto overflow-hidden bg-slate-100 border-2 border-amber-300 shadow-xs mb-3">
                        <img
                          src={scorers[2].avatarUrl}
                          alt={scorers[2].playerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-extrabold text-[#092c1a] text-sm truncate">
                        {scorers[2].playerName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <img src={scorers[2].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span className="truncate">{scorers[2].teamName}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#edf3ea]">
                      <span className="text-2xl font-black text-[#0e5632] tabular-nums">
                        {scorers[2].goals}
                      </span>
                      <span className="text-xs text-slate-500 block font-semibold">
                        buts en {scorers[2].matchesPlayed} matchs ({scorers[2].ratio} b/m)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Table of all Scorers */}
              <div className="rounded-3xl bg-white border border-[#dce6d8] overflow-hidden shadow-xs">
                <div className="p-4 bg-[#f8faf7] border-b border-[#edf3ea] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#092c1a]">
                      Classement Officiel des Buteurs
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedTournamentName} · {selectedTeamName}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#0e5632]">
                    {scorers.length} buteurs répertoriés
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f8faf7]/60 text-slate-500 border-b border-[#edf3ea] font-bold">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Joueur</th>
                        <th className="py-3 px-4">Équipe</th>
                        <th className="py-3 px-3 text-center">Poste</th>
                        <th className="py-3 px-3 text-center">MJ</th>
                        <th className="py-3 px-3 text-center font-extrabold text-[#0e5632]">Buts</th>
                        <th className="py-3 px-3 text-center">Pén.</th>
                        <th className="py-3 px-3 text-center">Ratio</th>
                        <th className="py-3 px-4 text-center">Min / But</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf3ea]">
                      {scorers.map((item) => (
                        <tr
                          key={item.playerId}
                          className="hover:bg-[#f6f9f5] transition-colors"
                        >
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-extrabold ${
                                item.rank === 1
                                  ? 'bg-[#c6f432] text-[#092c1a]'
                                  : item.rank === 2
                                  ? 'bg-slate-200 text-slate-800'
                                  : item.rank === 3
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.avatarUrl}
                                alt={item.playerName}
                                className="w-8 h-8 rounded-full object-cover bg-slate-100"
                              />
                              <span className="font-extrabold text-[#092c1a] hover:text-[#0e5632] transition-colors">
                                {item.playerName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <img src={item.teamLogo} alt="" className="w-4 h-4 rounded-full object-cover" />
                              <span className="truncate max-w-[140px]">{item.teamName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">
                            {item.position}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700 tabular-nums">
                            {item.matchesPlayed}
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums">
                            <span className="px-2.5 py-1 rounded-full bg-[#e8f5e6] text-[#0e5632] font-black text-xs">
                              {item.goals}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 tabular-nums">
                            {item.penalties}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800 tabular-nums">
                            {item.ratio}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 tabular-nums font-medium">
                            {item.minutesPerGoal > 0 ? `${item.minutesPerGoal} min` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEILLEURS PASSEURS */}
          {activeTab === 'assists' && (
            <div className="space-y-6">
              {/* Podium Top 3 Assists */}
              {assisters.length >= 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Rank 2 */}
                  <div className="order-2 sm:order-1 p-5 rounded-3xl bg-white border border-[#dce6d8] relative shadow-xs flex flex-col justify-between text-center">
                    <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center">
                      2
                    </div>
                    <div>
                      <div className="w-16 h-16 rounded-full mx-auto overflow-hidden bg-slate-100 border-2 border-slate-300 shadow-xs mb-3">
                        <img
                          src={assisters[1].avatarUrl}
                          alt={assisters[1].playerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-extrabold text-[#092c1a] text-sm truncate">
                        {assisters[1].playerName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <img src={assisters[1].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span className="truncate">{assisters[1].teamName}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#edf3ea]">
                      <span className="text-2xl font-black text-[#0e5632] tabular-nums">
                        {assisters[1].assists}
                      </span>
                      <span className="text-xs text-slate-500 block font-semibold">
                        passes décs ({assisters[1].ratio} p/m)
                      </span>
                    </div>
                  </div>

                  {/* Rank 1 */}
                  <div className="order-1 sm:order-2 p-6 rounded-3xl bg-gradient-to-b from-[#f2faee] to-white border-2 border-[#0e5632] relative shadow-sm flex flex-col justify-between text-center scale-102">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#c6f432] text-[#092c1a] font-extrabold text-[11px] shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 fill-[#092c1a]" />
                      <span>MEILLEUR PASSEUR</span>
                    </div>
                    <div>
                      <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-slate-100 border-3 border-[#0e5632] shadow-md mb-3 mt-2">
                        <img
                          src={assisters[0].avatarUrl}
                          alt={assisters[0].playerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-black text-[#092c1a] text-base truncate">
                        {assisters[0].playerName}
                      </h3>
                      <p className="text-xs font-bold text-[#0e5632] flex items-center justify-center gap-1 mt-0.5">
                        <img src={assisters[0].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span className="truncate">{assisters[0].teamName}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#edf3ea]">
                      <span className="text-3xl font-black text-[#0e5632] tabular-nums">
                        {assisters[0].assists}
                      </span>
                      <span className="text-xs font-bold text-[#092c1a] block">
                        passes décs ({assisters[0].ratio} p/m) · {assisters[0].keyPasses} passes clés
                      </span>
                    </div>
                  </div>

                  {/* Rank 3 */}
                  <div className="order-3 p-5 rounded-3xl bg-white border border-[#dce6d8] relative shadow-xs flex flex-col justify-between text-center">
                    <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <div className="w-16 h-16 rounded-full mx-auto overflow-hidden bg-slate-100 border-2 border-amber-300 shadow-xs mb-3">
                        <img
                          src={assisters[2].avatarUrl}
                          alt={assisters[2].playerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-extrabold text-[#092c1a] text-sm truncate">
                        {assisters[2].playerName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <img src={assisters[2].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span className="truncate">{assisters[2].teamName}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#edf3ea]">
                      <span className="text-2xl font-black text-[#0e5632] tabular-nums">
                        {assisters[2].assists}
                      </span>
                      <span className="text-xs text-slate-500 block font-semibold">
                        passes décs ({assisters[2].ratio} p/m)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Table of all Assisters */}
              <div className="rounded-3xl bg-white border border-[#dce6d8] overflow-hidden shadow-xs">
                <div className="p-4 bg-[#f8faf7] border-b border-[#edf3ea] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#092c1a]">
                      Classement Officiel des Passeurs
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedTournamentName} · {selectedTeamName}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#0e5632]">
                    {assisters.length} passeurs répertoriés
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f8faf7]/60 text-slate-500 border-b border-[#edf3ea] font-bold">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Passeur</th>
                        <th className="py-3 px-4">Équipe</th>
                        <th className="py-3 px-3 text-center">Poste</th>
                        <th className="py-3 px-3 text-center">MJ</th>
                        <th className="py-3 px-3 text-center font-extrabold text-[#0e5632]">Passes Décs</th>
                        <th className="py-3 px-3 text-center">Passes Clés</th>
                        <th className="py-3 px-3 text-center">Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf3ea]">
                      {assisters.map((item) => (
                        <tr
                          key={item.playerId}
                          className="hover:bg-[#f6f9f5] transition-colors"
                        >
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-extrabold ${
                                item.rank === 1
                                  ? 'bg-[#c6f432] text-[#092c1a]'
                                  : item.rank === 2
                                  ? 'bg-slate-200 text-slate-800'
                                  : item.rank === 3
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.avatarUrl}
                                alt={item.playerName}
                                className="w-8 h-8 rounded-full object-cover bg-slate-100"
                              />
                              <span className="font-extrabold text-[#092c1a]">
                                {item.playerName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <img src={item.teamLogo} alt="" className="w-4 h-4 rounded-full object-cover" />
                              <span className="truncate max-w-[140px]">{item.teamName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">
                            {item.position}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700 tabular-nums">
                            {item.matchesPlayed}
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums">
                            <span className="px-2.5 py-1 rounded-full bg-[#f2f9ec] text-[#0e5632] font-black text-xs">
                              {item.assists}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700 tabular-nums">
                            {item.keyPasses}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800 tabular-nums">
                            {item.ratio}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STATS DES ÉQUIPES */}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              {/* Highlight summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-3xl bg-white border border-[#dce6d8] shadow-2xs">
                  <span className="text-slate-400 text-xs font-semibold block">Meilleure Attaque</span>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <strong className="text-sm font-extrabold text-[#092c1a] block">
                        {teamStats[0]?.teamName}
                      </strong>
                      <span className="text-xs text-slate-500 font-medium">
                        {teamStats[0]?.goalsFor} buts marqués ({teamStats[0]?.goalsPerMatch} / match)
                      </span>
                    </div>
                    <Target className="w-8 h-8 text-[#0e5632] opacity-80" />
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-[#dce6d8] shadow-2xs">
                  <span className="text-slate-400 text-xs font-semibold block">Meilleure Défense</span>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <strong className="text-sm font-extrabold text-[#092c1a] block">
                        {teamStats[0]?.teamName}
                      </strong>
                      <span className="text-xs text-slate-500 font-medium">
                        {teamStats[0]?.goalsAgainst} buts concédés · {teamStats[0]?.cleanSheets} clean sheets
                      </span>
                    </div>
                    <Shield className="w-8 h-8 text-[#0e5632] opacity-80" />
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-[#dce6d8] shadow-2xs">
                  <span className="text-slate-400 text-xs font-semibold block">Leader Actuel</span>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <strong className="text-sm font-extrabold text-[#092c1a] block">
                        {teamStats[0]?.teamName}
                      </strong>
                      <span className="text-xs font-bold text-[#0e5632]">
                        {teamStats[0]?.points} pts · {teamStats[0]?.winRate}% victoires
                      </span>
                    </div>
                    <Trophy className="w-8 h-8 text-[#c6f432] fill-[#0e5632] stroke-[#0e5632]" />
                  </div>
                </div>
              </div>

              {/* Comprehensive Teams Comparison Table */}
              <div className="rounded-3xl bg-white border border-[#dce6d8] overflow-hidden shadow-xs">
                <div className="p-4 bg-[#f8faf7] border-b border-[#edf3ea] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#092c1a]">
                      Statistiques Comparatives Complètes des Clubs
                    </h2>
                    <p className="text-xs text-slate-500">
                      Attaque, solidité défensive, possession et discipline
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Cliquez sur une équipe pour voir sa fiche
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f8faf7]/60 text-slate-500 border-b border-[#edf3ea] font-bold">
                        <th className="py-3 px-4">Équipe</th>
                        <th className="py-3 px-3 text-center">MJ</th>
                        <th className="py-3 px-3 text-center">V</th>
                        <th className="py-3 px-3 text-center">N</th>
                        <th className="py-3 px-3 text-center">D</th>
                        <th className="py-3 px-3 text-center font-bold text-[#0e5632]">Pts</th>
                        <th className="py-3 px-3 text-center">BP</th>
                        <th className="py-3 px-3 text-center">BC</th>
                        <th className="py-3 px-3 text-center">Diff</th>
                        <th className="py-3 px-3 text-center">Poss.</th>
                        <th className="py-3 px-4 text-center">Buteur Phare</th>
                        <th className="py-3 px-4 text-center">Passeur Clé</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf3ea]">
                      {teamStats.map((team) => (
                        <tr
                          key={team.teamId}
                          onClick={() => setSelectedTeamModal(team)}
                          className="hover:bg-[#f6f9f5] transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={team.logoUrl}
                                alt={team.teamName}
                                className="w-7 h-7 rounded-xl object-cover bg-slate-100 border border-[#dce6d8]"
                              />
                              <div>
                                <strong className="font-extrabold text-[#092c1a] block">
                                  {team.teamName}
                                </strong>
                                <span className="text-[11px] text-slate-400 font-normal">
                                  {team.city}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums font-semibold">{team.matchesPlayed}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-[#0e5632] font-bold">{team.wins}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-slate-500">{team.draws}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-rose-600">{team.losses}</td>
                          <td className="py-3 px-3 text-center tabular-nums font-black text-sm text-[#0e5632]">
                            {team.points}
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums font-bold text-[#092c1a]">{team.goalsFor}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-slate-500">{team.goalsAgainst}</td>
                          <td className="py-3 px-3 text-center tabular-nums font-bold">
                            <span className={team.goalDifference > 0 ? 'text-[#0e5632]' : 'text-slate-600'}>
                              {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums font-medium text-slate-600">
                            {team.possessionAvg}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-[#0e5632] block truncate max-w-[130px]">
                              {team.topScorer.name}
                            </span>
                            <span className="text-[10px] text-slate-400">({team.topScorer.goals} buts)</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-[#092c1a] block truncate max-w-[130px]">
                              {team.topAssister.name}
                            </span>
                            <span className="text-[10px] text-slate-400">({team.topAssister.assists} passes)</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              className="px-3 py-1 bg-white hover:bg-[#eaf4ed] text-[#0e5632] border border-[#dce6d8] rounded-xl font-bold text-xs shadow-2xs transition-colors"
                            >
                              Fiche stats →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STATS DES JOUEURS */}
          {activeTab === 'players' && (
            <div className="space-y-6">
              {/* Secondary filters for player tab */}
              <div className="p-4 rounded-3xl bg-white border border-[#dce6d8] shadow-2xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    placeholder="Rechercher un joueur ou club..."
                    className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-full pl-10 pr-4 py-2.5 text-xs text-[#092c1a] focus:border-[#0e5632] outline-hidden"
                  />
                </div>

                <div className="w-full sm:w-auto">
                  <select
                    value={playerPositionFilter}
                    onChange={(e) => setPlayerPositionFilter(e.target.value)}
                    className="w-full sm:w-48 bg-[#f6f8f5] border border-[#dce6d8] rounded-full px-4 py-2.5 text-xs text-[#092c1a] font-semibold focus:border-[#0e5632] outline-hidden"
                  >
                    <option value="Tous">Tous les postes</option>
                    <option value="Avant-centre">Avant-centre</option>
                    <option value="Ailier Gauche">Ailier Gauche</option>
                    <option value="Ailier Droit">Ailier Droit</option>
                    <option value="Milieu Central">Milieu Central</option>
                    <option value="Milieu Offensif">Milieu Offensif</option>
                    <option value="Défenseur Central">Défenseur Central</option>
                    <option value="Gardien">Gardien</option>
                  </select>
                </div>
              </div>

              {/* Grid of Players Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerStats.map((player) => (
                  <div
                    key={player.playerId}
                    onClick={() => setSelectedPlayerModal(player)}
                    className="p-5 rounded-3xl bg-white border border-[#dce6d8] hover:border-[#0e5632] transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={player.avatarUrl}
                            alt={player.name}
                            className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-[#dce6d8]"
                          />
                          <div>
                            <h3 className="font-black text-[#092c1a] text-sm group-hover:text-[#0e5632] transition-colors">
                              {player.name}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <img src={player.teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                              <span className="truncate">{player.teamName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-[#f2faee] border border-[#d4e7d4] text-[#0e5632] font-black text-xs tabular-nums shadow-2xs">
                          ★ {player.rating.toFixed(1)}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#edf3ea] text-center text-xs">
                        <div className="p-2 rounded-xl bg-[#f8faf7]">
                          <span className="text-[10px] text-slate-400 block font-medium">Matchs</span>
                          <strong className="text-xs font-black text-[#092c1a] tabular-nums">
                            {player.appearances}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-[#e8f5e6]">
                          <span className="text-[10px] text-[#0e5632] block font-semibold">Buts</span>
                          <strong className="text-xs font-black text-[#0e5632] tabular-nums">
                            {player.goals}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-[#f8faf7]">
                          <span className="text-[10px] text-slate-400 block font-medium">Passes</span>
                          <strong className="text-xs font-black text-[#092c1a] tabular-nums">
                            {player.assists}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#edf3ea] flex items-center justify-between text-xs text-slate-500">
                      <span>{player.position} · {player.strongFoot}</span>
                      <span className="font-bold text-[#0e5632] group-hover:translate-x-0.5 transition-transform">
                        Détails →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Team Stats Modal */}
      {selectedTeamModal && (
        <Modal
          isOpen={!!selectedTeamModal}
          onClose={() => setSelectedTeamModal(null)}
          title={selectedTeamModal.teamName}
          subtitle={`Fiche Statistique Saisonnière · ${selectedTeamModal.division} (${selectedTeamModal.city})`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
              <img
                src={selectedTeamModal.logoUrl}
                alt={selectedTeamModal.teamName}
                className="w-16 h-16 rounded-2xl object-cover bg-white border border-[#dce6d8]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#092c1a]">
                    {selectedTeamModal.teamName}
                  </h3>
                  <span className="text-sm font-black text-[#0e5632]">
                    {selectedTeamModal.points} Points
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedTeamModal.matchesPlayed} matchs joués : {selectedTeamModal.wins} Victoires · {selectedTeamModal.draws} Nuls · {selectedTeamModal.losses} Défaites ({selectedTeamModal.winRate}% de succès)
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Forme :</span>
                  {selectedTeamModal.recentForm.map((res, i) => (
                    <FormIndicator key={i} result={res} size="sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-[11px] text-slate-500 block font-medium">Buts Marqués</span>
                <strong className="text-base font-black text-[#0e5632] tabular-nums">
                  {selectedTeamModal.goalsFor}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({selectedTeamModal.goalsPerMatch} / match)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-[11px] text-slate-500 block font-medium">Buts Encaissés</span>
                <strong className="text-base font-black text-rose-600 tabular-nums">
                  {selectedTeamModal.goalsAgainst}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({selectedTeamModal.goalsAgainstPerMatch} / match)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-[11px] text-slate-500 block font-medium">Clean Sheets</span>
                <strong className="text-base font-black text-[#092c1a] tabular-nums">
                  {selectedTeamModal.cleanSheets}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">matchs invaincus</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-[11px] text-slate-500 block font-medium">Possession Moy.</span>
                <strong className="text-base font-black text-[#092c1a] tabular-nums">
                  {selectedTeamModal.possessionAvg}%
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Précision : {selectedTeamModal.passAccuracy}%
                </span>
              </div>
            </div>

            {/* Key Players in Team */}
            <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#e2ebe0] space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Leaders de l&apos;effectif
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#dce6d8]">
                  <div className="w-8 h-8 rounded-full bg-[#e8f5e6] text-[#0e5632] flex items-center justify-center font-bold">
                    🎯
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Meilleur Buteur</span>
                    <strong className="font-extrabold text-[#092c1a]">
                      {selectedTeamModal.topScorer.name}
                    </strong>
                    <span className="text-slate-500 block">
                      {selectedTeamModal.topScorer.goals} buts inscrits
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#dce6d8]">
                  <div className="w-8 h-8 rounded-full bg-[#f2f7f0] text-[#0e5632] flex items-center justify-center font-bold">
                    👟
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Meilleur Passeur</span>
                    <strong className="font-extrabold text-[#092c1a]">
                      {selectedTeamModal.topAssister.name}
                    </strong>
                    <span className="text-slate-500 block">
                      {selectedTeamModal.topAssister.assists} passes décisives
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Discipline : {selectedTeamModal.yellowCards} cartons jaunes · {selectedTeamModal.redCards} cartons rouges
              </span>
              <button
                onClick={() => {
                  setSelectedTeamModal(null);
                  navigateToResource('teams', selectedTeamModal.teamId);
                }}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Voir la page du club
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Player Stats Modal */}
      {selectedPlayerModal && (
        <Modal
          isOpen={!!selectedPlayerModal}
          onClose={() => setSelectedPlayerModal(null)}
          title={selectedPlayerModal.name}
          subtitle={`${selectedPlayerModal.position} · ${selectedPlayerModal.teamName}`}
          maxWidth="md"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
              <img
                src={selectedPlayerModal.avatarUrl}
                alt={selectedPlayerModal.name}
                className="w-16 h-16 rounded-full object-cover bg-white border border-[#dce6d8]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#092c1a]">
                    {selectedPlayerModal.name}
                  </h3>
                  <span className="px-2.5 py-1 rounded-full bg-[#c6f432] text-[#092c1a] font-extrabold text-xs">
                    ★ {selectedPlayerModal.rating.toFixed(1)} / 10
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedPlayerModal.age} ans · {selectedPlayerModal.strongFoot} · {selectedPlayerModal.teamName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-[10px] text-slate-500 block">Matchs</span>
                <strong className="text-base font-black text-[#092c1a] tabular-nums">
                  {selectedPlayerModal.appearances}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {selectedPlayerModal.minutesPlayed} min
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#e8f5e6] border border-[#d4e7d4]">
                <span className="text-[10px] text-[#0e5632] block font-semibold">Buts</span>
                <strong className="text-base font-black text-[#0e5632] tabular-nums">
                  {selectedPlayerModal.goals}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {selectedPlayerModal.shotsOnTarget} tirs cadrés
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-[10px] text-slate-500 block">Passes Décs</span>
                <strong className="text-base font-black text-[#092c1a] tabular-nums">
                  {selectedPlayerModal.assists}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {selectedPlayerModal.passAccuracy}% préc.
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-[10px] text-slate-500 block">Cartons</span>
                <strong className="text-base font-black text-amber-700 tabular-nums">
                  {selectedPlayerModal.yellowCards} J
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {selectedPlayerModal.redCards} R
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPlayerModal(null);
                navigateToResource('players', selectedPlayerModal.playerId);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <span>Consulter le profil sportif complet</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
