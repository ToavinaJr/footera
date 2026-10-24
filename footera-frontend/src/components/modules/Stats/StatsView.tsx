import React, { useState, useEffect } from 'react';
import { SelectField } from '../../common/SelectField';
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
  Team
} from '../../../types';
import { Badge, FormIndicator } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { EntityLink } from '../../common/EntityLink';
import { useApp } from '../../../context/useApp';
import { formatFiniteNumber } from '../../../utils/numberFormat';
import { catalogsService } from '../../../services/catalogsService';
import { useTranslation } from '../../../i18n';

export const StatsView: React.FC = () => {
  const { showToast, navigateToResource } = useApp();
  const { t } = useTranslation();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'teams' | 'players'>('scorers');

  // Filters
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerPositionFilter, setPlayerPositionFilter] = useState<string>('Tous');
  const [positionOptions, setPositionOptions] = useState<string[]>([]);

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
        const [tournList, teamList, catalogOptions] = await Promise.all([
          tournamentsService.list(),
          teamsService.list(),
          catalogsService.getOptions(),
        ]);
        setTournaments(tournList);
        setTeams(teamList);
        setPositionOptions(catalogOptions.playerPositions);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : t('common.loadOptionsError'), 'error');
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
            tournamentId: selectedTournamentId,
            position: playerPositionFilter as import('../../../types').Position,
            searchQuery: playerSearchQuery,
          }),
        ]);

        setScorers(scorersData);
        setAssisters(assistersData);
        setTeamStats(teamStatsData);
        setPlayerStats(playersData);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : t('common.loadStatsError'), 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadStatsData();
  }, [selectedTournamentId, selectedTeamId, playerPositionFilter, playerSearchQuery, showToast]);

  const selectedTournamentName =
    selectedTournamentId === 'all'
      ? t('stats.allCompetitions')
      : tournaments.find((tournament) => tournament.id === selectedTournamentId)?.title || t('stats.competition');

  const selectedTeamName =
    selectedTeamId === 'all'
      ? t('stats.allTeams')
      : teams.find((team) => team.id === selectedTeamId)?.name || t('stats.team');

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight flex items-center gap-2.5">
            <span>{t('stats.title')}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-lime-volt text-pitch-ink text-xs font-black tracking-normal">
              {t('stats.pro')}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {t('stats.description')}
          </p>
        </div>

        {/* Global Context Indicators */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-pitch-line px-3.5 py-2 rounded-2xl shadow-2xs self-start md:self-auto">
          <Activity className="w-4 h-4 text-pitch-primary" />
          <span>{t('stats.season', { year: 2026 })}</span>
        </div>
      </div>

      {/* Global Filter Bar: Tournoi & Équipe */}
      <div className="p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-pitch-primary" />
            <span>{t('stats.filterTournament')}</span>
          </label>
          <SelectField
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="w-full bg-pitch-input border border-pitch-line rounded-2xl px-3.5 py-2.5 text-xs md:text-sm text-pitch-ink font-semibold focus:border-pitch-primary outline-hidden"
          >
            <option value="all">🏆 {t('stats.allCompetitions')}</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.format})
              </option>
            ))}
          </SelectField>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-pitch-primary" />
            <span>{t('stats.filterTeam')}</span>
          </label>
          <SelectField
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full bg-pitch-input border border-pitch-line rounded-2xl px-3.5 py-2.5 text-xs md:text-sm text-pitch-ink font-semibold focus:border-pitch-primary outline-hidden"
          >
            <option value="all">{t('stats.allTeams')}</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.city})
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('scorers')}
          className={`px-4 py-2.5 min-h-11 rounded-2xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'scorers'
              ? 'bg-pitch-primary text-white shadow-xs'
              : 'bg-white border border-pitch-line text-slate-600 hover:text-pitch-ink'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{t('stats.scorers')}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-caption">
            {scorers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assists')}
          className={`px-4 py-2.5 min-h-11 rounded-2xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'assists'
              ? 'bg-pitch-primary text-white shadow-xs'
              : 'bg-white border border-pitch-line text-slate-600 hover:text-pitch-ink'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('stats.assisters')}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-caption">
            {assisters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 min-h-11 rounded-2xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'teams'
              ? 'bg-pitch-primary text-white shadow-xs'
              : 'bg-white border border-pitch-line text-slate-600 hover:text-pitch-ink'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t('stats.teams')}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-caption">
            {teamStats.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2.5 min-h-11 rounded-2xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'players'
              ? 'bg-pitch-primary text-white shadow-xs'
              : 'bg-white border border-pitch-line text-slate-600 hover:text-pitch-ink'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('stats.players')}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-caption">
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
                <div className="grid grid-cols-1 items-stretch gap-4 pt-4 sm:grid-cols-3 sm:items-end">
                  {/* Rank 2 (Silver) */}
                  <div className="relative order-2 flex min-h-64 flex-col justify-between rounded-3xl border border-pitch-line bg-white p-5 text-center shadow-xs sm:order-1">
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
                      <h3 className="font-extrabold text-pitch-ink text-sm truncate">
                        <EntityLink section="players" id={scorers[1].playerId}>{scorers[1].playerName}</EntityLink>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <img src={scorers[1].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <EntityLink section="teams" id={scorers[1].teamId} className="truncate">{scorers[1].teamName}</EntityLink>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-pitch-separator">
                      <span className="text-2xl font-black text-pitch-primary tabular-nums">
                        {scorers[1].goals}
                      </span>
                      <span className="text-xs text-slate-500 block font-semibold">
                        {t('stats.goalsInMatches', { goals: scorers[1].goals, matches: scorers[1].matchesPlayed, ratio: scorers[1].ratio })}
                      </span>
                    </div>
                  </div>

                  {/* Rank 1 (Gold) */}
                  <div className="relative order-1 flex min-h-80 flex-col justify-between rounded-3xl border-2 border-pitch-primary bg-linear-to-b from-[#f2faee] to-white p-6 text-center shadow-md sm:order-2">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-lime-volt text-pitch-ink font-extrabold text-caption shadow-xs flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-pitch-ink" />
                      <span>{t('stats.scorers').toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-slate-100 border-3 border-pitch-primary shadow-md mb-3 mt-2">
                        <img
                          src={scorers[0].avatarUrl}
                          alt={scorers[0].playerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-black text-pitch-ink text-base truncate">
                        <EntityLink section="players" id={scorers[0].playerId}>{scorers[0].playerName}</EntityLink>
                      </h3>
                      <p className="text-xs font-bold text-pitch-primary flex items-center justify-center gap-1 mt-0.5">
                        <img src={scorers[0].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <EntityLink section="teams" id={scorers[0].teamId} className="truncate">{scorers[0].teamName}</EntityLink>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-pitch-separator">
                      <span className="text-3xl font-black text-pitch-primary tabular-nums">
                        {scorers[0].goals}
                      </span>
                      <span className="text-xs font-bold text-pitch-ink block">
                        {t('stats.goalsInMatches', { goals: scorers[0].goals, matches: scorers[0].matchesPlayed, ratio: scorers[0].ratio })}
                      </span>
                    </div>
                  </div>

                  {/* Rank 3 (Bronze) */}
                  <div className="relative order-3 flex min-h-60 flex-col justify-between rounded-3xl border border-pitch-line bg-white p-5 text-center shadow-xs">
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
                      <h3 className="font-extrabold text-pitch-ink text-sm truncate">
                        <EntityLink section="players" id={scorers[2].playerId}>{scorers[2].playerName}</EntityLink>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <img src={scorers[2].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <EntityLink section="teams" id={scorers[2].teamId} className="truncate">{scorers[2].teamName}</EntityLink>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-pitch-separator">
                      <span className="text-2xl font-black text-pitch-primary tabular-nums">
                        {scorers[2].goals}
                      </span>
                      <span className="text-xs text-slate-500 block font-semibold">
                        {t('stats.goalsInMatches', { goals: scorers[2].goals, matches: scorers[2].matchesPlayed, ratio: scorers[2].ratio })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Table of all Scorers */}
              <div className="rounded-3xl bg-white border border-pitch-line overflow-hidden shadow-xs">
                <div className="p-4 bg-pitch-panel border-b border-pitch-separator flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-pitch-ink">
                      {t('stats.scorerRanking')}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedTournamentName} · {selectedTeamName}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-pitch-primary">
                    {t('stats.scorersListed', { count: scorers.length })}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-pitch-panel/60 text-slate-500 border-b border-pitch-separator font-bold">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">{t('stats.player')}</th>
                        <th className="py-3 px-4">{t('stats.team')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.position')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.appearancesShort')}</th>
                        <th className="py-3 px-3 text-center font-extrabold text-pitch-primary">{t('stats.goals')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.penaltiesShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.ratio')}</th>
                        <th className="py-3 px-4 text-center">{t('stats.minutesPerGoal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pitch-separator">
                      {scorers.map((item) => (
                        <tr
                          key={item.playerId}
                          className="hover:bg-[#f6f9f5] transition-colors"
                        >
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-extrabold ${
                                item.rank === 1
                                  ? 'bg-lime-volt text-pitch-ink'
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
                              <EntityLink section="players" id={item.playerId} className="font-extrabold text-pitch-ink transition-colors">{item.playerName}</EntityLink>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <img src={item.teamLogo} alt="" className="w-4 h-4 rounded-full object-cover" />
                              <EntityLink section="teams" id={item.teamId} className="truncate max-w-35">{item.teamName}</EntityLink>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">
                            {item.position}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700 tabular-nums">
                            {item.matchesPlayed}
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums">
                            <span className="px-2.5 py-1 rounded-full bg-[#e8f5e6] text-pitch-primary font-black text-xs">
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
                            {typeof item.minutesPerGoal === 'number' ? `${item.minutesPerGoal} ${t('stats.minutes')}` : t('stats.notRecorded')}
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
                <div className="grid grid-cols-1 items-stretch gap-4 pt-4 sm:grid-cols-3 sm:items-end">
                  {/* Rank 2 */}
                  <div className="relative order-2 flex min-h-64 flex-col justify-between rounded-3xl border border-pitch-line bg-white p-5 text-center shadow-xs sm:order-1">
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
                      <h3 className="font-extrabold text-pitch-ink text-sm truncate">
                        <EntityLink section="players" id={assisters[1].playerId}>{assisters[1].playerName}</EntityLink>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <img src={assisters[1].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <EntityLink section="teams" id={assisters[1].teamId} className="truncate">{assisters[1].teamName}</EntityLink>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-pitch-separator">
                      <span className="text-2xl font-black text-pitch-primary tabular-nums">
                        {assisters[1].assists}
                      </span>
                      <span className="text-xs text-slate-500 block font-semibold">
                        {t('stats.assistsInMatches', { assists: assisters[1].assists, matches: assisters[1].matchesPlayed, ratio: assisters[1].ratio })}
                      </span>
                    </div>
                  </div>

                  {/* Rank 1 */}
                  <div className="relative order-1 flex min-h-80 flex-col justify-between rounded-3xl border-2 border-pitch-primary bg-linear-to-b from-[#f2faee] to-white p-6 text-center shadow-md sm:order-2">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-lime-volt text-pitch-ink font-extrabold text-caption shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 fill-pitch-ink" />
                      <span>{t('stats.assisters').toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-slate-100 border-3 border-pitch-primary shadow-md mb-3 mt-2">
                        <img
                          src={assisters[0].avatarUrl}
                          alt={assisters[0].playerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-black text-pitch-ink text-base truncate">
                        <EntityLink section="players" id={assisters[0].playerId}>{assisters[0].playerName}</EntityLink>
                      </h3>
                      <p className="text-xs font-bold text-pitch-primary flex items-center justify-center gap-1 mt-0.5">
                        <img src={assisters[0].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <EntityLink section="teams" id={assisters[0].teamId} className="truncate">{assisters[0].teamName}</EntityLink>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-pitch-separator">
                      <span className="text-3xl font-black text-pitch-primary tabular-nums">
                        {assisters[0].assists}
                      </span>
                      <span className="text-xs font-bold text-pitch-ink block">
                        {t('stats.assistsInMatches', { assists: assisters[0].assists, matches: assisters[0].matchesPlayed, ratio: assisters[0].ratio })} · {t('stats.keyPasses', { count: assisters[0].keyPasses })}
                      </span>
                    </div>
                  </div>

                  {/* Rank 3 */}
                  <div className="relative order-3 flex min-h-60 flex-col justify-between rounded-3xl border border-pitch-line bg-white p-5 text-center shadow-xs">
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
                      <h3 className="font-extrabold text-pitch-ink text-sm truncate">
                        <EntityLink section="players" id={assisters[2].playerId}>{assisters[2].playerName}</EntityLink>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <img src={assisters[2].teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        <EntityLink section="teams" id={assisters[2].teamId} className="truncate">{assisters[2].teamName}</EntityLink>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-pitch-separator">
                      <span className="text-2xl font-black text-pitch-primary tabular-nums">
                        {assisters[2].assists}
                      </span>
                      <span className="text-xs text-slate-500 block font-semibold">
                        {t('stats.assistsInMatches', { assists: assisters[2].assists, matches: assisters[2].matchesPlayed, ratio: assisters[2].ratio })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Table of all Assisters */}
              <div className="rounded-3xl bg-white border border-pitch-line overflow-hidden shadow-xs">
                <div className="p-4 bg-pitch-panel border-b border-pitch-separator flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-pitch-ink">
                      {t('stats.assisterRanking')}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedTournamentName} · {selectedTeamName}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-pitch-primary">
                    {t('stats.assistersListed', { count: assisters.length })}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-pitch-panel/60 text-slate-500 border-b border-pitch-separator font-bold">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">{t('stats.assister')}</th>
                        <th className="py-3 px-4">{t('stats.team')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.position')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.appearancesShort')}</th>
                        <th className="py-3 px-3 text-center font-extrabold text-pitch-primary">{t('stats.assistsShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.keyPassesShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.ratio')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pitch-separator">
                      {assisters.map((item) => (
                        <tr
                          key={item.playerId}
                          className="hover:bg-[#f6f9f5] transition-colors"
                        >
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-extrabold ${
                                item.rank === 1
                                  ? 'bg-lime-volt text-pitch-ink'
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
                              <EntityLink section="players" id={item.playerId} className="font-extrabold text-pitch-ink">{item.playerName}</EntityLink>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <img src={item.teamLogo} alt="" className="w-4 h-4 rounded-full object-cover" />
                              <EntityLink section="teams" id={item.teamId} className="truncate max-w-35">{item.teamName}</EntityLink>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">
                            {item.position}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700 tabular-nums">
                            {item.matchesPlayed}
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums">
                            <span className="px-2.5 py-1 rounded-full bg-[#f2f9ec] text-pitch-primary font-black text-xs">
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
                <div className="p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs">
                  <span className="text-slate-400 text-xs font-semibold block">{t('stats.bestAttack')}</span>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <strong className="text-sm font-extrabold text-pitch-ink block">
                        <EntityLink section="teams" id={teamStats[0]?.teamId}>{teamStats[0]?.teamName}</EntityLink>
                      </strong>
                      <span className="text-xs text-slate-500 font-medium">
                        {t('stats.goalsFor', { count: formatFiniteNumber(teamStats[0]?.goalsFor), average: formatFiniteNumber(teamStats[0]?.goalsPerMatch, 2) })}
                      </span>
                    </div>
                    <Target className="w-8 h-8 text-pitch-primary opacity-80" />
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs">
                  <span className="text-slate-400 text-xs font-semibold block">{t('stats.bestDefense')}</span>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <strong className="text-sm font-extrabold text-pitch-ink block">
                        <EntityLink section="teams" id={teamStats[0]?.teamId}>{teamStats[0]?.teamName}</EntityLink>
                      </strong>
                      <span className="text-xs text-slate-500 font-medium">
                        {t('stats.goalsAgainst', { count: teamStats[0]?.goalsAgainst ?? 0 })} · {t('stats.cleanSheets', { count: teamStats[0]?.cleanSheets ?? 0 })}
                      </span>
                    </div>
                    <Shield className="w-8 h-8 text-pitch-primary opacity-80" />
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs">
                  <span className="text-slate-400 text-xs font-semibold block">{t('stats.currentLeader')}</span>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <strong className="text-sm font-extrabold text-pitch-ink block">
                        <EntityLink section="teams" id={teamStats[0]?.teamId}>{teamStats[0]?.teamName}</EntityLink>
                      </strong>
                      <span className="text-xs font-bold text-pitch-primary">
                        {t('stats.pointsWins', { points: teamStats[0]?.points ?? 0, rate: teamStats[0]?.winRate ?? 0 })}
                      </span>
                    </div>
                    <Trophy className="w-8 h-8 text-lime-volt fill-pitch-primary stroke-pitch-primary" />
                  </div>
                </div>
              </div>

              {/* Comprehensive Teams Comparison Table */}
              <div className="rounded-3xl bg-white border border-pitch-line overflow-hidden shadow-xs">
                <div className="p-4 bg-pitch-panel border-b border-pitch-separator flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-pitch-ink">
                      {t('stats.teamComparison')}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t('stats.teamComparisonDescription')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {t('stats.clickTeamDetails')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-pitch-panel/60 text-slate-500 border-b border-pitch-separator font-bold">
                        <th className="py-3 px-4">{t('stats.team')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.appearancesShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.winsShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.drawsShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.lossesShort')}</th>
                        <th className="py-3 px-3 text-center font-bold text-pitch-primary">{t('stats.pointsShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.goalsForShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.goalsAgainstShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.differenceShort')}</th>
                        <th className="py-3 px-3 text-center">{t('stats.possessionShort')}</th>
                        <th className="py-3 px-4 text-center">{t('stats.featureScorer')}</th>
                        <th className="py-3 px-4 text-center">{t('stats.featureAssister')}</th>
                        <th className="py-3 px-4 text-center">{t('stats.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pitch-separator">
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
                                className="w-7 h-7 rounded-xl object-cover bg-slate-100 border border-pitch-line"
                              />
                              <div>
                                <strong className="font-extrabold text-pitch-ink block">
                                  <EntityLink section="teams" id={team.teamId}>{team.teamName}</EntityLink>
                                </strong>
                                <span className="text-caption text-slate-400 font-normal">
                                  {team.city}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums font-semibold">{team.matchesPlayed}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-pitch-primary font-bold">{team.wins}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-slate-500">{team.draws}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-rose-600">{team.losses}</td>
                          <td className="py-3 px-3 text-center tabular-nums font-black text-sm text-pitch-primary">
                            {team.points}
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums font-bold text-pitch-ink">{team.goalsFor}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-slate-500">{team.goalsAgainst}</td>
                          <td className="py-3 px-3 text-center tabular-nums font-bold">
                            <span className={team.goalDifference > 0 ? 'text-pitch-primary' : 'text-slate-600'}>
                              {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums font-medium text-slate-600">
                            {team.possessionAvg === null ? t('stats.notRecorded') : `${team.possessionAvg}%`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-pitch-primary block truncate max-w-32.5">
                              <EntityLink section="players" id={team.topScorer.playerId}>{team.topScorer.name}</EntityLink>
                            </span>
                            <span className="text-micro text-slate-400">({t('stats.goalsCount', { count: team.topScorer.goals })})</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-pitch-ink block truncate max-w-32.5">
                              <EntityLink section="players" id={team.topAssister.playerId}>{team.topAssister.name}</EntityLink>
                            </span>
                            <span className="text-micro text-slate-400">({t('stats.assistsCount', { count: team.topAssister.assists })})</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              className="px-3 py-1 bg-white hover:bg-pitch-light text-pitch-primary border border-pitch-line rounded-xl font-bold text-xs shadow-2xs transition-colors"
                            >
                              {t('stats.viewStats')}
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
              <div className="p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    placeholder={t('stats.searchPlayerTeam')}
                    className="w-full bg-pitch-input border border-pitch-line rounded-full pl-10 pr-4 py-2.5 text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                  />
                </div>

                <div className="w-full sm:w-auto">
                  <SelectField
                    value={playerPositionFilter}
                    onChange={(e) => setPlayerPositionFilter(e.target.value)}
                    className="w-full sm:w-48 bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs text-pitch-ink font-semibold focus:border-pitch-primary outline-hidden"
                  >
                    <option value="Tous">{t('stats.allPositions')}</option>
                    {positionOptions.map((position) => <option key={position} value={position}>{position}</option>)}
                  </SelectField>
                </div>
              </div>

              {/* Grid of Players Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerStats.map((player) => (
                  <div
                    key={player.playerId}
                    onClick={() => setSelectedPlayerModal(player)}
                    className="p-5 rounded-3xl bg-white border border-pitch-line hover:border-pitch-primary transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={player.avatarUrl}
                            alt={player.name}
                            className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-pitch-line"
                          />
                          <div>
                            <h3 className="font-black text-pitch-ink text-sm group-hover:text-pitch-primary transition-colors">
                              <EntityLink section="players" id={player.playerId}>{player.name}</EntityLink>
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <img src={player.teamLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                              <EntityLink section="teams" id={player.teamId} className="truncate">{player.teamName}</EntityLink>
                            </p>
                          </div>
                        </div>

                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-pitch-separator text-center text-xs">
                        <div className="p-2 rounded-xl bg-pitch-panel">
                          <span className="text-micro text-slate-400 block font-medium">{t('stats.matches')}</span>
                          <strong className="text-xs font-black text-pitch-ink tabular-nums">
                            {player.appearances}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-[#e8f5e6]">
                          <span className="text-micro text-pitch-primary block font-semibold">{t('stats.goals')}</span>
                          <strong className="text-xs font-black text-pitch-primary tabular-nums">
                            {player.goals}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-pitch-panel">
                          <span className="text-micro text-slate-400 block font-medium">{t('stats.passes')}</span>
                          <strong className="text-xs font-black text-pitch-ink tabular-nums">
                            {player.assists}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-pitch-separator flex items-center justify-between text-xs text-slate-500">
                      <span>{player.position} · {player.strongFoot}</span>
                      <span className="font-bold text-pitch-primary group-hover:translate-x-0.5 transition-transform">
                        {t('stats.details')}
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
          subtitle={`${t('stats.seasonProfile')} · ${selectedTeamModal.division} (${selectedTeamModal.city})`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
              <img
                src={selectedTeamModal.logoUrl}
                alt={selectedTeamModal.teamName}
                className="w-16 h-16 rounded-2xl object-cover bg-white border border-pitch-line"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-pitch-ink">
                    <EntityLink section="teams" id={selectedTeamModal.teamId}>{selectedTeamModal.teamName}</EntityLink>
                  </h3>
                  <span className="text-sm font-black text-pitch-primary">
                    {selectedTeamModal.points} {t('stats.points')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {t('stats.matchSummary', { played: selectedTeamModal.matchesPlayed, wins: selectedTeamModal.wins, draws: selectedTeamModal.draws, losses: selectedTeamModal.losses, rate: selectedTeamModal.winRate })}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-caption text-slate-400 font-semibold mr-1">{t('stats.form')}</span>
                  {selectedTeamModal.recentForm.map((res, i) => (
                    <FormIndicator key={i} result={res} size="sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-caption text-slate-500 block font-medium">{t('stats.goalsScored')}</span>
                <strong className="text-base font-black text-pitch-primary tabular-nums">
                  {selectedTeamModal.goalsFor}
                </strong>
                <span className="text-micro text-slate-400 block mt-0.5">
                  ({formatFiniteNumber(selectedTeamModal.goalsPerMatch, 2)} / {t('stats.matches').toLowerCase()})
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-caption text-slate-500 block font-medium">{t('stats.goalsConceded')}</span>
                <strong className="text-base font-black text-rose-600 tabular-nums">
                  {selectedTeamModal.goalsAgainst}
                </strong>
                <span className="text-micro text-slate-400 block mt-0.5">
                  ({formatFiniteNumber(selectedTeamModal.goalsAgainstPerMatch, 2)} / {t('stats.matches').toLowerCase()})
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-caption text-slate-500 block font-medium">{t('stats.cleanSheetsLabel')}</span>
                <strong className="text-base font-black text-pitch-ink tabular-nums">
                  {selectedTeamModal.cleanSheets}
                </strong>
                <span className="text-micro text-slate-400 block mt-0.5">{t('stats.cleanSheetMatches')}</span>
              </div>

              <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-caption text-slate-500 block font-medium">{t('stats.averagePossession')}</span>
                <strong className="text-base font-black text-pitch-ink tabular-nums">
                  {selectedTeamModal.possessionAvg === null ? t('stats.notRecorded') : `${selectedTeamModal.possessionAvg}%`}
                </strong>
              </div>
            </div>

            {/* Key Players in Team */}
            <div className="p-4 rounded-2xl bg-pitch-panel border border-border-subtle space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('stats.squadLeaders')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-pitch-line">
                  <div className="w-8 h-8 rounded-full bg-[#e8f5e6] text-pitch-primary flex items-center justify-center font-bold">
                    🎯
                  </div>
                  <div>
                    <span className="text-micro text-slate-400 block">{t('stats.bestScorer')}</span>
                    <strong className="font-extrabold text-pitch-ink">
                      <EntityLink section="players" id={selectedTeamModal.topScorer.playerId}>{selectedTeamModal.topScorer.name}</EntityLink>
                    </strong>
                    <span className="text-slate-500 block">
                      {t('stats.goalsScoredCount', { count: selectedTeamModal.topScorer.goals })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-pitch-line">
                  <div className="w-8 h-8 rounded-full bg-pitch-selected text-pitch-primary flex items-center justify-center font-bold">
                    👟
                  </div>
                  <div>
                    <span className="text-micro text-slate-400 block">{t('stats.bestAssister')}</span>
                    <strong className="font-extrabold text-pitch-ink">
                      <EntityLink section="players" id={selectedTeamModal.topAssister.playerId}>{selectedTeamModal.topAssister.name}</EntityLink>
                    </strong>
                    <span className="text-slate-500 block">
                      {t('stats.assistsCount', { count: selectedTeamModal.topAssister.assists })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {t('stats.discipline', { yellow: selectedTeamModal.yellowCards, red: selectedTeamModal.redCards })}
              </span>
              <button
                onClick={() => {
                  setSelectedTeamModal(null);
                  navigateToResource('teams', selectedTeamModal.teamId);
                }}
                className="px-4 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {t('stats.viewTeamPage')}
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
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
              <img
                src={selectedPlayerModal.avatarUrl}
                alt={selectedPlayerModal.name}
                className="w-16 h-16 rounded-full object-cover bg-white border border-pitch-line"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-pitch-ink">
                    {selectedPlayerModal.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedPlayerModal.age ? t('stats.yearsOld', { age: selectedPlayerModal.age }) : t('stats.ageUnknown')} · {selectedPlayerModal.strongFoot} · {selectedPlayerModal.teamName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-micro text-slate-500 block">{t('stats.matches')}</span>
                <strong className="text-base font-black text-pitch-ink tabular-nums">
                  {selectedPlayerModal.appearances}
                </strong>
                <span className="text-micro text-slate-400 block mt-0.5">
                  {selectedPlayerModal.minutesPlayed === null ? t('stats.notRecorded') : `${selectedPlayerModal.minutesPlayed} ${t('stats.minutes')}`}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#e8f5e6] border border-[#d4e7d4]">
                <span className="text-micro text-pitch-primary block font-semibold">{t('stats.goals')}</span>
                <strong className="text-base font-black text-pitch-primary tabular-nums">
                  {selectedPlayerModal.goals}
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-micro text-slate-500 block">{t('stats.assistsShort')}</span>
                <strong className="text-base font-black text-pitch-ink tabular-nums">
                  {selectedPlayerModal.assists}
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-micro text-slate-500 block">{t('stats.cards')}</span>
                <strong className="text-base font-black text-amber-700 tabular-nums">
                  {selectedPlayerModal.yellowCards} J
                </strong>
                <span className="text-micro text-slate-400 block mt-0.5">
                  {selectedPlayerModal.redCards} R
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPlayerModal(null);
                navigateToResource('players', selectedPlayerModal.playerId);
              }}
              className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <span>{t('stats.playerProfile')}</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
