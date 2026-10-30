import React from 'react';
import { useTranslation } from '../../i18n';

export const ListPageLayout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="page-enter space-y-6 pb-16">{children}</div>
);

export const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({ title, description, actions }) => (
  <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <div><h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-pitch-ink sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}</div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

export function ListError({ error, onRetry }: { error: Error | string | null; onRetry: () => void }) {
  const { t } = useTranslation();
  if (!error) return null;
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
    <span>{error instanceof Error ? error.message : error}</span>
    <button type="button" onClick={onRetry} className="min-h-11 rounded-xl border px-4 font-bold">{t('list.retry')}</button>
  </div>;
}

export function Pagination({ page, totalPages, total, setPage }: { page: number; totalPages: number; total: number; setPage: (value: number) => void }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  return <nav aria-label={t('list.pagination')} className="flex flex-wrap items-center justify-center gap-3 py-3">
    <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="min-h-11 rounded-xl border border-pitch-line px-4 text-sm disabled:opacity-40">{t('list.previous')}</button>
    <span aria-live="polite" className="text-sm text-slate-600">{t('list.page', { page, pages: totalPages, count: total })}</span>
    <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="min-h-11 rounded-xl border border-pitch-line px-4 text-sm disabled:opacity-40">{t('list.next')}</button>
  </nav>;
}
