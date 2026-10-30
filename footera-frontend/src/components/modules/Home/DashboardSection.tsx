import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../../i18n';
import type { DashboardActivity, DashboardMatch } from '../../../services/dashboardService';
import { useApp } from '../../../context/useApp';
import { CardTitle } from '../../common/CardTitle';

export function DashboardSection({ title, href, children, empty }: PropsWithChildren<{ title: string; href?: string; empty?: boolean }>) {
  const { t } = useTranslation();
  return <section className="surface-card space-y-4 rounded-3xl border border-pitch-line bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{title}</CardTitle>{href && <Link className="min-h-10 content-center text-xs font-bold text-pitch-primary hover:underline" to={href}>{t('home.viewAll')} <span aria-hidden="true">↗</span></Link>}</div>
    {empty ? <p className="py-3 text-sm text-slate-500">{t('dashboard.empty')}</p> : children}
  </section>;
}

export function DashboardMatchCard({ match }: { match: DashboardMatch }) {
  const { t } = useTranslation();
  return <Link to={`/matches/${encodeURIComponent(match.id)}`} className="match-preview group block rounded-2xl border border-pitch-line p-4 transition-colors hover:bg-pitch-panel">
    <span className="card-title text-xs font-semibold">{match.competition}</span><span className="ml-2 inline-flex items-center gap-1.5 text-xs font-bold text-pitch-primary">{match.status === 'LIVE' && <i className="live-dot" aria-hidden="true" />}{match.status === 'LIVE' ? t('matches.filterLive') : match.status === 'FINISHED' ? t('matches.finishedStatus') : t('matches.filterUpcoming')}</span>
    <div className="my-2 flex items-center justify-between gap-3 text-sm font-bold"><span>{match.homeTeam.name}</span><span className="shrink-0">{match.status === 'SCHEDULED' ? '—' : `${match.homeTeam.score} - ${match.awayTeam.score}`}</span><span className="text-right">{match.awayTeam.name}</span></div>
    <span className="text-xs text-slate-500">{match.date} · {match.time} · {match.venue}</span>
  </Link>;
}

export function ActivityList({ items }: { items: DashboardActivity[] }) {
  const { navigateToResource } = useApp();
  const { language } = useTranslation();
  return <ul className="divide-y divide-pitch-line">{items.map((item) => <li key={item.id} className="py-3">
    <button type="button" disabled={!item.targetSection} onClick={() => item.targetSection && navigateToResource(item.targetSection, item.targetId)} className="w-full text-left enabled:hover:text-pitch-primary">
      <span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs text-slate-600">{item.description}</span>
      {item.createdAt && Number.isFinite(Date.parse(item.createdAt)) && <time dateTime={item.createdAt} className="mt-1 block text-xs text-slate-400">{new Date(item.createdAt).toLocaleString(language === 'mg' ? 'fr-MG' : language)}</time>}
    </button>
  </li>)}</ul>;
}
