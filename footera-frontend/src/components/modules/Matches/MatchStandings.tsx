import { Trophy } from 'lucide-react';
import type { LeagueStandingRow } from '../../../types';
import { EntityLink } from '../../common/EntityLink';
import { useTranslation } from '../../../i18n';

export function MatchStandings({ standings }: { standings: LeagueStandingRow[] }) {
  const { t } = useTranslation();
  return (<div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-pitch-line shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-sm font-extrabold text-pitch-ink">{t('matches.standings')}</h2>
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
          </div>);
}
