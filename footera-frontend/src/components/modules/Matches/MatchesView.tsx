import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { matchesService } from '../../../services/matchesService';
import type { Match, LeagueStandingRow } from '../../../types';
import { useApp } from '../../../context/useApp';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { useUrlState } from '../../../hooks/useUrlState';
import { useResource } from '../../../hooks/useResource';
import { useTranslation } from '../../../i18n';
import { ListPageLayout, PageHeader, ListError, Pagination, useListPagination } from '../../common/ListPage';
import { EmptyState } from '../../common/EmptyState';
import { CardSkeleton } from '../../common/Skeleton';
import { MatchCard } from './MatchCard';
import { MatchDetail } from './MatchDetail';
import { MatchStandings } from './MatchStandings';

export const MatchesView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useApp();
  const modal = useRouteModal('/matches');
  const [status, setStatus] = useUrlState<'ALL' | 'LIVE' | 'SCHEDULED' | 'FINISHED'>('status', 'ALL', ['ALL', 'LIVE', 'SCHEDULED', 'FINISHED']);
  const [favorites, setFavorites] = useUrlState<boolean>('favorites', false);
  const [managed, setManaged] = useUrlState<boolean>('managed', false);
  const list = useResource<Match[]>(status, () => matchesService.list(status), []);
  const standings = useResource<LeagueStandingRow[]>('standings', matchesService.getLeagueStandings, []);
  const permissions = useResource<string[]>(user?.id ?? '', matchesService.manageableIds, [], !!user);
  const detail = useResource<Match | null>(modal.resourceId ?? '', () => matchesService.getById(modal.resourceId!), null, !!modal.resourceId);
  const selected = detail.data?.id === modal.resourceId ? detail.data : null;
  const page = useListPagination(list.data.filter((match) => (!favorites || user?.favoriteMatchIds?.includes(match.id)) && (!managed || permissions.data.includes(match.id))));
  const refresh = () => { list.refresh(); standings.refresh(); permissions.refresh(); if (modal.resourceId) detail.refresh(); };
  useEffect(() => {
    if (!list.data.some((match) => match.status === 'LIVE') && selected?.status !== 'LIVE') return;
    const timer = window.setInterval(() => { list.refresh(); standings.refresh(); if (modal.resourceId) detail.refresh(); }, 30000);
    return () => window.clearInterval(timer);
  }, [list.data, selected?.status, modal.resourceId, list.refresh, standings.refresh, detail.refresh]);

  return <ListPageLayout>
    <PageHeader title={t('matches.pageTitle')} description={t('matches.pageDescription')} actions={<button type="button" onClick={refresh} className="min-h-11 rounded-xl border border-pitch-line px-4 text-sm">{t('list.refresh')}</button>} />
    <div className="flex flex-wrap items-center gap-2">
      {(['ALL', 'LIVE', 'SCHEDULED', 'FINISHED'] as const).map((value, index) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={'min-h-11 rounded-xl border px-4 text-sm font-bold ' + (status === value ? 'bg-pitch-primary text-white' : 'border-pitch-line bg-white')}>{t((['matches.filterAll', 'matches.filterLive', 'matches.filterUpcoming', 'matches.filterFinished'] as const)[index])}</button>)}
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-pitch-line bg-white px-3 text-sm"><input type="checkbox" checked={favorites} onChange={(event) => setFavorites(event.target.checked)} />{t('list.favorites')}</label>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-pitch-line bg-white px-3 text-sm"><input type="checkbox" checked={managed} onChange={(event) => setManaged(event.target.checked)} />{t('list.mine')}</label>
    </div>
    <ListError error={list.error || standings.error || permissions.error} onRetry={refresh} />
    <div className="grid items-start gap-6 lg:grid-cols-3"><div className="space-y-4 lg:col-span-2">
      {list.loading ? <CardSkeleton /> : page.total === 0 ? <EmptyState icon={Calendar} title={t('matches.emptyTitle')} description={t('matches.emptyDescription')} actionLabel={t('matches.viewAll')} onAction={() => navigate('/matches', { replace: true })} /> : page.items.map((match) => <MatchCard key={match.id} match={match} onOpen={() => modal.openDetail(match.id)} />)}
      <Pagination {...page} />
    </div><MatchStandings standings={standings.data} /></div>
    {modal.resourceId && <ListError error={detail.error} onRetry={detail.refresh} />}
    {modal.resourceId && detail.loading && !selected && <CardSkeleton />}
    {selected && <MatchDetail match={selected} canManage={permissions.data.includes(selected.id)} onClose={modal.close} onMatchUpdated={(match) => { detail.setData(match); list.setData((current) => current.map((item) => item.id === match.id ? match : item)); refresh(); }} />}
  </ListPageLayout>;
};
