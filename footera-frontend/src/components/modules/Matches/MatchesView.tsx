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

export const MatchesView: React.FC = () => {
  const { showToast, selectedResourceId, navigateToResource } = useApp();
  const matchModal = useRouteModal('/matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<LeagueStandingRow[]>([]);
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
        const [data, stand] = await Promise.all([
          matchesService.list(statusFilter),
          matchesService.getLeagueStandings(),
        ]);
        setMatches(data);
        setStandings(stand);

      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Erreur lors du chargement des matchs', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, [statusFilter, selectedResourceId, showToast]);

  const handleToggleFollow = async () => {
    if (!selectedMatch) return;
    try {
      const res = await matchesService.toggleFollow(selectedMatch.id);
      setIsFollowing(res);
      showToast(res ? 'Match ajouté à vos favoris' : 'Match retiré de vos favoris');
    } catch {
      showToast('Erreur lors du suivi', 'error');
    }
  };

  return (
    <div className="page-enter space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            Matchs & Compétitions
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Résultats en direct, chronologie des buts et classement officiel de la division.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-pitch-line rounded-2xl self-start md:self-auto overflow-x-auto shadow-2xs">
          {[
            { label: 'Tous', value: 'ALL' },
            { label: 'En direct', value: 'LIVE' },
            { label: 'À venir', value: 'SCHEDULED' },
            { label: 'Terminés', value: 'FINISHED' },
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
          title="Aucun match trouvé"
          description="Il n'y a aucun match correspondant au statut sélectionné."
          actionLabel="Voir tous les matchs"
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
                        {match.minute ? `${match.minute}'` : 'LIVE'}
                      </span>
                    )}
                    {match.status === 'SCHEDULED' && (
                      <span className="text-slate-600 font-semibold">
                        {match.date} · {match.time}
                      </span>
                    )}
                    {match.status === 'FINISHED' && (
                      <span className="text-slate-500 font-semibold">Score final</span>
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
                      <span className="text-caption text-slate-400">Domicile</span>
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
                      <span className="text-caption text-slate-400">Extérieur</span>
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
                    Détails & Temps forts →
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
                  <h2 className="text-sm font-extrabold text-pitch-ink">Classement Officiel</h2>
                  <p className="text-caption text-slate-500">Régional 2 (Saison 2026)</p>
                </div>
                <Trophy className="w-4 h-4 text-pitch-primary" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-micro text-slate-400 border-b border-pitch-separator uppercase font-bold">
                    <tr>
                      <th className="pb-2">#</th>
                      <th className="pb-2">Équipe</th>
                      <th className="pb-2 text-center">MJ</th>
                      <th className="pb-2 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pitch-separator tabular-nums font-medium text-slate-700">
                    {standings.map((r) => (
                      <tr key={r.teamId} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-500">{r.position}</td>
                        <td className="py-2.5 font-bold truncate max-w-[130px] text-pitch-ink">
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
            {/* Scoreboard */}
            <div className="p-5 rounded-3xl bg-pitch-panel border border-pitch-line text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs">
                {selectedMatch.status === 'LIVE' ? (
                  <Badge variant="emerald" size="sm">
                    ● En direct ({selectedMatch.minute}&apos;)
                  </Badge>
                ) : selectedMatch.status === 'FINISHED' ? (
                  <Badge variant="slate" size="sm">
                    Terminé
                  </Badge>
                ) : (
                  <Badge variant="amber" size="sm">
                    Prévu le {selectedMatch.date} à {selectedMatch.time}
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
                <h4 className="text-xs font-bold text-pitch-ink">Temps forts</h4>
                <div className="space-y-1.5">
                  {selectedMatch.events.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-pitch-panel border border-border-subtle flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 text-center font-extrabold text-pitch-primary tabular-nums">
                          {ev.minute}&apos;
                        </span>
                        <span>{ev.type === 'goal' ? '⚽ But' : '🟨 Carton'}</span>
                        <strong className="text-pitch-ink">{ev.player}</strong>
                        {ev.assist && (
                          <span className="text-slate-500 text-caption">(Passe de {ev.assist})</span>
                        )}
                      </div>
                      {ev.description && (
                        <span className="text-slate-500 text-caption hidden sm:inline">
                          {ev.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Match Stats */}
            {selectedMatch.stats && (
              <div className="space-y-3 p-4 rounded-2xl bg-pitch-panel border border-pitch-line text-xs">
                <h4 className="font-bold text-pitch-ink mb-2">Statistiques de la rencontre</h4>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1 tabular-nums font-semibold">
                    <span>{selectedMatch.stats.possession[0]}%</span>
                    <span>Possession</span>
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
                  <span>{isFollowing ? 'Match suivi (Favoris)' : 'Suivre les alertes de ce match'}</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
