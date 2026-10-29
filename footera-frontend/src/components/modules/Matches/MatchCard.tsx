import { MapPin } from 'lucide-react';
import type { Match } from '../../../types';
import { EntityLink } from '../../common/EntityLink';
import { useApp } from '../../../context/useApp';
import { useTranslation } from '../../../i18n';

export function MatchCard({ match, onOpen }: { match: Match; onOpen: () => void }) {
  const { t } = useTranslation();
  const { navigateToResource } = useApp();
  return (<div
                role="button"
                tabIndex={0}
                onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen(); } }}
                onClick={onOpen}
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
                      <h3 className="card-title text-sm sm:text-base font-extrabold text-pitch-ink group-hover:text-pitch-primary transition-colors truncate">
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
                      <h3 className="card-title text-sm sm:text-base font-extrabold text-pitch-ink group-hover:text-pitch-primary transition-colors truncate">
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
              </div>);
}
