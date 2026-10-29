import { Calendar,MapPin,Plus,Trophy } from 'lucide-react';
import React from 'react';
import { formatDateForDisplay } from '../../../utils/date';
import { EmptyState } from '../../common/EmptyState';
import { ListError,ListPageLayout,Pagination } from '../../common/ListPage';
import { ListToolbar } from '../../common/ListToolbar';
import { SelectField } from '../../common/SelectField';
import { CardSkeleton } from '../../common/Skeleton';
import { TournamentsDialogs } from './TournamentsDialogs';
import { useTournamentsViewModel } from './useTournamentsViewModel';


export const TournamentsView: React.FC = () => {
  const model = useTournamentsViewModel();
  const { t, tournamentModal, list, query, setQuery, favorites, setFavorites, mine, setMine, status, setStatus, page, isLoading, detail, selectedTournament, handleOpenCreateTournament } = model;

  return (
    <ListPageLayout>
      <ListError error={list.error || detail.error} onRetry={() => { list.refresh(); detail.refresh(); }} />
      {/* Header with CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            Tournois & Compétitions
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Participez aux tournois majeurs (11v11, Five, Futsal), remportez des dotations et hissez votre club au sommet.
          </p>
        </div>

        <button
          onClick={handleOpenCreateTournament}
          className="px-5 py-2.5 min-h-11 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('tournaments.organize')}</span>
        </button>
      </div>

      <ListToolbar query={query} onQuery={setQuery} favorites={favorites} onFavorites={setFavorites} mine={mine} onMine={setMine}>
        <SelectField value={status} onChange={(event) => setStatus(event.target.value)} aria-label={t('matches.filterAll')} className="min-h-11 rounded-xl border border-pitch-line px-3 text-sm">
          <option value="ALL">{t('list.all')}</option><option value="INSCRIPTIONS_OUVERTES">{t('matches.filterUpcoming')}</option><option value="EN_COURS">{t('matches.filterLive')}</option><option value="TERMINE">{t('matches.filterFinished')}</option>
        </SelectField>
      </ListToolbar>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : page.total === 0 ? (
        <EmptyState
          icon={Trophy}
          title={t('tournaments.emptyTitle')}
          description={t('tournaments.emptyDescription')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {page.items.map((tourn) => (
            <div
              key={tourn.id}
              onClick={() => tournamentModal.openDetail(tourn.id)}
              className="rounded-3xl bg-white border border-pitch-line hover:border-pitch-primary/50 overflow-hidden transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={tourn.bannerUrl}
                    alt={tourn.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full bg-lime-volt text-pitch-ink font-extrabold text-xs shadow-xs">
                      {tourn.status === 'INSCRIPTIONS_OUVERTES' ? t('tournaments.open') : t('tournaments.inProgress')}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-xs font-bold text-lime-volt block mb-0.5">
                      {tourn.format} · {tourn.organizer}
                    </span>
                    <h3 className="card-title text-lg font-extrabold  truncate">
                      {tourn.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-pitch-primary shrink-0" />
                      <span>{formatDateForDisplay(tourn.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-pitch-primary shrink-0" />
                      <span className="truncate">{tourn.city}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-pitch-panel border border-border-subtle flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-caption block font-medium">{t('tournaments.prizePool')}</span>
                      <strong className="text-pitch-primary font-extrabold text-base tabular-nums">
                        {tourn.prizePool.toLocaleString()} €
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-caption block font-medium">{t('tournaments.teamsEngaged')}</span>
                      <strong className="text-pitch-ink font-extrabold text-sm tabular-nums">
                        {tourn.registeredTeams} / {tourn.maxTeams}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-pitch-panel border-t border-pitch-separator flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{tourn.venue}</span>
                <span className="font-bold text-pitch-primary group-hover:translate-x-0.5 transition-transform">
                  {t('tournaments.view')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination {...page} />
      {tournamentModal.resourceId && detail.loading && !selectedTournament && <CardSkeleton />}
      <TournamentsDialogs model={model} />
    </ListPageLayout>
  );
};
