import type { PropsWithChildren } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '../../i18n';

export function ListToolbar({ query, onQuery, favorites, onFavorites, mine, onMine, children }: PropsWithChildren<{
  query?: string; onQuery?: (value: string) => void;
  favorites?: boolean; onFavorites?: (value: boolean) => void;
  mine?: boolean; onMine?: (value: boolean) => void;
}>) {
  const { t } = useTranslation();
  return <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-pitch-line bg-white p-3 shadow-xs">
    {onQuery && <label className="relative min-w-44 flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" /><input type="search" aria-label={t('list.search')} placeholder={t('list.search')} value={query ?? ''} onChange={(event) => onQuery(event.target.value)} className="min-h-11 w-full rounded-xl bg-pitch-input pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-pitch-primary/20" /></label>}
    {onFavorites && <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-pitch-panel px-3 text-sm font-semibold"><input type="checkbox" checked={favorites ?? false} onChange={(event) => onFavorites(event.target.checked)} className="accent-pitch-primary" />{t('list.favorites')}</label>}
    {onMine && <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-pitch-panel px-3 text-sm font-semibold"><input type="checkbox" checked={mine ?? false} onChange={(event) => onMine(event.target.checked)} className="accent-pitch-primary" />{t('list.mine')}</label>}
    {children}
  </div>;
}
