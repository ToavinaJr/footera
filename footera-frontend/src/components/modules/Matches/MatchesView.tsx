import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Trophy, Star, Clock, MapPin, ChevronRight, Check } from 'lucide-react';
import { matchesService } from '../../../services/matchesService';
import { Match, LeagueStandingRow } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { EntityLink } from '../../common/EntityLink';
import { useApp } from '../../../context/useApp';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { MatchManagementPanel } from './MatchManagementPanel';
import { useTranslation } from '../../../i18n';

export const MatchesView: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, selectedResourceId, navigateToResource, user } = useApp();
  const matchModal = useRouteModal('/matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<LeagueStandingRow[]>([]);
  const [manageableMatchIds, setManageableMatchIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'FINISHED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Match modal
  const selectedMatch = matchModal.resourceId
    ? matches.find((match) => match.id === matchModal.resourceId) ?? null
    : selectedResourceId
      ? matches.find((match) => match.id === selectedResourceId) ?? null
      : null;
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function loadMatches() {
      setIsLoading(true);
      try {
        const [data, stand, manageableIds] = await Promise.all([
          matchesService.list(statusFilter),
          matchesService.getLeagueStandings(),
          user ? matchesService.manageableIds().catch(() => [] as string[]) : Promise.resolve([] as string[]),
        ]);
        setMatches(data);
        setStandings(stand);
        setManageableMatchIds(manageableIds);

      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : t('matches.loadError'), 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, [statusFilter, selectedResourceId, showToast, user?.id, t]);

  const handleToggleFollow = async () => {
    if (!selectedMatch) return;
    try {
      const res = await matchesService.toggleFollow(selectedMatch.id);
      setIsFollowing(res);
      showToast(res ? t('matches.favoriteAdded') : t('matches.favoriteRemoved'));
    } catch {
      showToast(t('matches.followError'), 'error');
    }
  };

  return (
    <div className="page-enter space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            {t('matches.pageTitle')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {t('matches.pageDescription')}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-pitch-line rounded-2xl self-start md:self-auto overflow-x-auto shadow-2xs">
          {[
            { label: t('matches.filterAll'), value: 'ALL' },
            { label: t('matches.filterLive'), value: 'LIVE' },
            { label: t('matches.filterUpcoming'), value: 'SCHEDULED' },
            { label: t('matches.filterFinished'), value: 'FINISHED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as typeof statusFilter)}
              className={`px-4 py-2 min-h-11 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-pitch-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matches List */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('matches.emptyTitle')}
          description={t('matches.emptyDescription')}
          actionLabel={t('matches.viewAll')}
          onAction={() => setStatusFilter('ALL')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Matches column */}
          <div className="lg:col-span-2 space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                onClick={() => matchModal.openDetail(match.id)}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-pitch-line hover:border-pitch-primary/50 transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 pb-3 mb-3 border-b border-pitch-separator">
                  <span className="font-bold text-pitch-ink">{match.competition}</span>
                  <div className="flex items-center gap-2">
                    {match.status === 'LIVE' && (
                      <span className="inline-flex items-center gap-1.5 text-[#059669] font-extrabold tabular-nums bg-[#ecfdf5] px-2.5 py-0.5 rounded-full border border-[#a7f3d0]">
                        <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                        {match.minute ? t('matches.liveStatus', { minute: match.minute }) : t('matches.filterLive')}
                      </span>
                    )}
                    {match.status === 'SCHEDULED' && (
                      <span className="text-slate-600 font-semibold">
                        {t('matches.scheduledStatus', { date: match.date, time: match.time })}
                      </span>
                    )}
                    {match.status === 'FINISHED' && (
                        <span className="text-slate-500 font-semibold">{t('matches.finalScore')}</span>
                    )}
                  </div>
                </div>

                {/* Match Teams Row */}
                <div className="grid grid-cols-7 items-center gap-3 py-2">
                  {/* Home */}
                  <div className="col-span-3 flex items-center gap-3">
                    <img
                      src={match.homeTeam.logoUrl}
                      alt={match.homeTeam.name}
                      className="w-11 h-11 rounded-2xl object-cover bg-slate-100 border border-pitch-line shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-extrabold text-pitch-ink group-hover:text-pitch-primary transition-colors truncate">
                        <EntityLink section="teams" id={match.homeTeam.id}>{match.homeTeam.name}</EntityLink>
                      </h3>
                      <span className="text-caption text-slate-400">{t('matches.home')}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-1 text-center">
                    {match.status === 'SCHEDULED' ? (
                      <span className="text-xs font-bold text-slate-600 px-2.5 py-1 rounded-full bg-slate-100">
                        {match.time}
                      </span>
                    ) : (
                      <div className="text-2xl font-extrabold text-pitch-ink tracking-wider tabular-nums">
                        {match.homeTeam.score} - {match.awayTeam.score}
                      </div>
                    )}
                  </div>

                  {/* Away */}
                  <div className="col-span-3 flex items-center justify-end gap-3 text-right">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-extrabold text-pitch-ink group-hover:text-pitch-primary transition-colors truncate">
                        <EntityLink section="teams" id={match.awayTeam.id}>{match.awayTeam.name}</EntityLink>
                      </h3>
                      <span className="text-caption text-slate-400">{t('matches.away')}</span>
                    </div>
                    <img
                      src={match.awayTeam.logoUrl}
                      alt={match.awayTeam.name}
                      className="w-11 h-11 rounded-2xl object-cover bg-slate-100 border border-pitch-line shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 mt-3 border-t border-pitch-separator">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigateToResource('pitches', match.pitchId);
                      }}
                      className="truncate text-left text-xs text-slate-500 hover:text-pitch-primary hover:underline focus-visible:outline-2 focus-visible:outline-pitch-primary"
                    >
                      {match.pitchName || match.venue}
                    </button>
                  </div>
                  <span className="text-xs font-bold text-pitch-primary group-hover:translate-x-0.5 transition-transform shrink-0">
                    {t('matches.details')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Standings widget in matches view */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-pitch-line shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-pitch-ink">{t('matches.standings')}</h2>
                  <p className="text-caption text-slate-500">{t('matches.leagueSeason')}</p>
                </div>
                <Trophy className="w-4 h-4 text-pitch-primary" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-micro text-slate-400 border-b border-pitch-separator uppercase font-bold">
                    <tr>
                      <th className="pb-2">#</th>
                      <th className="pb-2">{t('matches.teamLabel')}</th>
                      <th className="pb-2 text-center">{t('matches.playedShort')}</th>
                      <th className="pb-2 text-right">{t('matches.pointsShort')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pitch-separator tabular-nums font-medium text-slate-700">
                    {standings.map((r) => (
                      <tr key={r.teamId} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-500">{r.position}</td>
                        <td className="py-2.5 font-bold truncate max-w-32.5 text-pitch-ink">
                          <EntityLink section="teams" id={r.teamId}>{r.teamName}</EntityLink>
                        </td>
                        <td className="py-2.5 text-center text-slate-500">{r.played}</td>
                        <td className="py-2.5 text-right font-extrabold text-pitch-primary">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Details Modal */}
      {selectedMatch && (
        <Modal
          isOpen={!!selectedMatch}
          onClose={matchModal.close}
          title={selectedMatch.competition}
          subtitle={`${selectedMatch.venue} · ${selectedMatch.date}`}
          maxWidth="xl"
        >
          <div className="space-y-6">
            {manageableMatchIds.includes(selectedMatch.id) && selectedMatch.status !== 'FINISHED' && (
              <MatchManagementPanel
                match={selectedMatch}
                onMatchUpdated={(updatedMatch) => setMatches((current) => current.map((match) => match.id === updatedMatch.id ? updatedMatch : match))}
              />
            )}
            {/* Scoreboard */}
            <div className="p-5 rounded-3xl bg-pitch-panel border border-pitch-line text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs">
                {selectedMatch.status === 'LIVE' ? (
                  <Badge variant="emerald" size="sm">
                    {t('matches.liveStatus', { minute: selectedMatch.minute ?? 0 })}
                  </Badge>
                ) : selectedMatch.status === 'FINISHED' ? (
                  <Badge variant="slate" size="sm">
                    {t('matches.finishedStatus')}
                  </Badge>
                ) : (
                  <Badge variant="amber" size="sm">
                    {t('matches.scheduledStatus', { date: selectedMatch.date, time: selectedMatch.time })}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-5 items-center gap-3">
                <div className="col-span-2 text-center">
                  <img
                    src={selectedMatch.homeTeam.logoUrl}
                    alt={selectedMatch.homeTeam.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-white mx-auto mb-1.5 border border-pitch-line"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs sm:text-sm font-extrabold text-pitch-ink block">
                    <EntityLink section="teams" id={selectedMatch.homeTeam.id}>{selectedMatch.homeTeam.name}</EntityLink>
                  </span>
                </div>

                <div className="col-span-1">
                  {selectedMatch.status === 'SCHEDULED' ? (
                    <span className="text-base font-bold text-slate-500">{selectedMatch.time}</span>
                  ) : (
                    <div className="text-3xl font-extrabold text-pitch-ink tracking-widest tabular-nums">
                      {selectedMatch.homeTeam.score} - {selectedMatch.awayTeam.score}
                    </div>
                  )}
                </div>

                <div className="col-span-2 text-center">
                  <img
                    src={selectedMatch.awayTeam.logoUrl}
                    alt={selectedMatch.awayTeam.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-white mx-auto mb-1.5 border border-pitch-line"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs sm:text-sm font-extrabold text-pitch-ink block">
                    <EntityLink section="teams" id={selectedMatch.awayTeam.id}>{selectedMatch.awayTeam.name}</EntityLink>
                  </span>
                </div>
              </div>
            </div>

            {/* Events Timeline */}
            {selectedMatch.events && selectedMatch.events.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-pitch-ink">{t('matches.highlights')}</h4>
                <div className="space-y-1.5">
                  {selectedMatch.events.map((ev, idx) => {
                    const isHomeEvent = ev.teamId === selectedMatch.homeTeam.id;
                    const isAwayEvent = ev.teamId === selectedMatch.awayTeam.id;
                    const eventDetails = (
                      <div className={`min-w-0 space-y-1 ${isAwayEvent ? 'text-right' : 'text-left'}`}>
                        <div className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 ${isAwayEvent ? 'justify-end' : 'justify-start'}`}>
                          <span>{ev.type === 'goal' || ev.type === 'penalty' ? `⚽ ${t('matches.goalEvent')}` : `🟨 ${t('matches.cardEvent')}`}</span>
                          <EntityLink section="players" id={ev.playerId} className="wrap-break-word font-extrabold text-pitch-ink">
                            {ev.player}
                          </EntityLink>
                          {ev.assist && (
                            <span className="text-slate-500 text-caption">
                              ({t('matches.assistBy')}{' '}
                              <EntityLink section="players" id={ev.assistPlayerId} className="font-semibold">
                                {ev.assist}
                              </EntityLink>)
                            </span>
                          )}
                        </div>
                        {ev.description && <span className="block wrap-break-word text-slate-500 text-caption">{ev.description}</span>}
                      </div>
                    );

                    return (
                      <div
                        key={`${ev.teamId}-${ev.minute}-${idx}`}
                        className="grid grid-cols-3 items-start gap-2 rounded-2xl border border-border-subtle bg-pitch-panel p-3 text-xs"
                      >
                        {isHomeEvent || isAwayEvent ? (
                          <>
                            <div className="min-w-0">{isHomeEvent ? eventDetails : null}</div>
                            <span className="pt-0.5 text-center font-extrabold tabular-nums text-pitch-primary">
                              {ev.minute}&apos;
                            </span>
                            <div className="min-w-0">{isAwayEvent ? eventDetails : null}</div>
                          </>
                        ) : (
                          <div className="col-span-3 text-center">{eventDetails}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Match Stats */}
            {selectedMatch.stats && (
              <div className="space-y-3 p-4 rounded-2xl bg-pitch-panel border border-pitch-line text-xs">
                <h4 className="font-bold text-pitch-ink mb-2">{t('matches.statsTitle')}</h4>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1 tabular-nums font-semibold">
                    <span>{selectedMatch.stats.possession[0]}%</span>
                    <span>{t('matches.possession')}</span>
                    <span>{selectedMatch.stats.possession[1]}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full flex overflow-hidden">
                    <div
                      className="bg-pitch-primary h-full"
                      style={{ width: `${selectedMatch.stats.possession[0]}%` }}
                    />
                    <div
                      className="bg-lime-volt h-full"
                      style={{ width: `${selectedMatch.stats.possession[1]}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMatch.status !== 'FINISHED' && (
              <div className="pt-2">
                <button
                  onClick={handleToggleFollow}
                  className="w-full py-3 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Star className={`w-4 h-4 ${isFollowing ? 'text-lime-volt fill-lime-volt' : ''}`} />
                  <span>{isFollowing ? t('matches.following') : t('matches.followAlerts')}</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
