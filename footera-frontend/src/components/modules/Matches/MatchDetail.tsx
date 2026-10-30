import { useState } from 'react';
import { Star } from 'lucide-react';
import type { Match } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { EntityLink } from '../../common/EntityLink';
import { useApp } from '../../../context/useApp';
import { useTranslation } from '../../../i18n';
import { MatchManagementPanel } from './MatchManagementPanel';

export function MatchDetail({ match: selectedMatch, canManage, onClose, onMatchUpdated }: { match: Match; canManage: boolean; onClose: () => void; onMatchUpdated: (match: Match) => void }) {
  const { t } = useTranslation();
  const { user, setFavorite, showToast } = useApp();
  const isFollowing = user?.favoriteMatchIds?.includes(selectedMatch.id) ?? false;
  const [busy, setBusy] = useState(false);
  const handleToggleFollow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const followed = await setFavorite('matches', selectedMatch.id, !isFollowing);
      showToast(followed ? t('matches.favoriteAdded') : t('matches.favoriteRemoved'));
    } catch (error) { showToast(error instanceof Error ? error.message : t('matches.followError'), 'error'); }
    finally { setBusy(false); }
  };
  return (<Modal
          isOpen={!!selectedMatch}
          onClose={onClose}
          title={selectedMatch.competition}
          subtitle={`${selectedMatch.venue} · ${selectedMatch.date}`}
          maxWidth="xl"
        >
          <div className="space-y-6">
            {canManage && selectedMatch.status !== 'FINISHED' && (
              <MatchManagementPanel
                match={selectedMatch}
                onMatchUpdated={onMatchUpdated}
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

            {(selectedMatch.status !== 'FINISHED' || isFollowing) && (
              <div className="pt-2">
                <button
                  onClick={handleToggleFollow}
                  disabled={busy}
                  className="w-full py-3 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Star className={`w-4 h-4 ${isFollowing ? 'text-lime-volt fill-lime-volt' : ''}`} />
                  <span>{isFollowing ? t('matches.following') : t('matches.followAlerts')}</span>
                </button>
              </div>
            )}
          </div>
        </Modal>);
}
