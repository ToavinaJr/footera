import { Briefcase,Search,XCircle } from 'lucide-react';
import React from 'react';
import { Badge } from '../../common/Badge';
import { EmptyState } from '../../common/EmptyState';
import { EntityLink } from '../../common/EntityLink';
import { ListError,ListPageLayout,Pagination } from '../../common/ListPage';
import { MultiSelectField } from '../../common/MultiSelectField';
import { CardSkeleton } from '../../common/Skeleton';
import { RecruitmentDialogs } from './RecruitmentDialogs';
import { useRecruitmentViewModel } from './useRecruitmentViewModel';

export const RecruitmentView: React.FC = () => {
  const model = useRecruitmentViewModel();
  const { t, adModal, activeTab, setActiveTab, searchQuery, setSearchQuery, positionFilter, setPositionFilter, positionOptions, list, applications, ads, myApplications, isLoading, page, applicationPage, detail, activeAd, cancellingApplicationId, openApplication, handleCancelApplication } = model;

  return (
    <ListPageLayout>
      <ListError error={list.error || applications.error || detail.error} onRetry={() => { list.refresh(); applications.refresh(); detail.refresh(); }} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            {t('nav.mercato')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {t('recruitment.pageDescription')}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-pitch-line rounded-2xl self-start md:self-auto shadow-2xs">
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2 min-h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ads'
                ? 'bg-pitch-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('recruitment.offersTab', { count: ads.length })}
          </button>
          <button
            onClick={() => setActiveTab('my-applications')}
            className={`px-4 py-2 min-h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'my-applications'
                ? 'bg-pitch-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('recruitment.applicationsTab', { count: myApplications.length })}
          </button>
        </div>
      </div>

      {activeTab === 'ads' ? (
        <div className="space-y-4">
          <div className="relative z-50 grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('recruitment.searchPlaceholder')}
                className="w-full bg-pitch-input border border-pitch-line rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-pitch-ink placeholder-slate-400 focus:border-pitch-primary focus:bg-white outline-hidden"
              />
            </div>
            <div>
              <MultiSelectField ariaLabel={t('recruitment.filterPosition')} placeholder={t('recruitment.allPositions')} options={positionOptions.map((position) => ({ value: position, label: position }))} value={positionFilter} onChange={setPositionFilter} className="w-full rounded-full bg-pitch-input px-4 py-2.5 text-xs md:text-sm" />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : ads.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t('recruitment.noAds')}
              description={t('recruitment.changeFilters')}
            />
          ) : (
            <div className="space-y-4">
              {page.items.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => adModal.openDetail(ad.id)}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-pitch-line hover:border-pitch-primary/50 transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={ad.teamLogoUrl}
                      alt={ad.teamName}
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-pitch-line shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="card-title text-base font-extrabold text-pitch-ink">{ad.positionSought}</h2>
                        <Badge variant="emerald" size="sm">{ad.division}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        <EntityLink section="teams" id={ad.teamId}>{ad.teamName}</EntityLink> · {ad.city}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-xl mt-1">
                        {ad.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-pitch-separator">
                    <span className="text-xs font-bold text-pitch-primary">
                      {t('recruitment.candidateCount', { count: ad.candidatesCount })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openApplication(ad);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      {t('recruitment.apply')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t('recruitment.noApplications')}
              description={t('recruitment.noApplicationsDescription')}
              actionLabel={t('recruitment.viewOffers')}
              onAction={() => setActiveTab('ads')}
            />
          ) : (
            <div className="space-y-3">
              {applicationPage.items.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-3xl bg-white border border-pitch-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="card-title text-sm font-extrabold text-pitch-ink">{app.adTitle}</h2>
                      <Badge variant={app.status === 'ACCEPTEE' ? 'emerald' : app.status === 'RETIRÉE' ? 'rose' : 'amber'} size="sm">
                        {app.status === 'EN_REVUE' ? t('recruitment.inReview') : app.status === 'ACCEPTEE' ? t('recruitment.accepted') : app.status === 'RETIRÉE' ? t('recruitment.withdrawn') : t('recruitment.rejected')}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t('recruitment.club')} <strong className="text-slate-800"><EntityLink section="teams" id={ads.find((ad) => ad.id === app.adId)?.teamId}>{app.teamName}</EntityLink></strong> · {t('recruitment.phone')} {app.phone}
                    </p>
                    <p className="text-xs text-slate-600 italic mt-1">« {app.message} »</p>
                  </div>
                  {app.status === 'EN_REVUE' && <button type="button" disabled={cancellingApplicationId !== null} onClick={() => void handleCancelApplication(app)} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60">
                    <XCircle className="h-4 w-4" aria-hidden="true" />{cancellingApplicationId === app.id ? t('recruitment.cancelling') : t('recruitment.cancelApplication')}
                  </button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Pagination {...(activeTab === 'ads' ? page : applicationPage)} />
      {adModal.resourceId && detail.loading && !activeAd && <CardSkeleton />}
      <RecruitmentDialogs model={model} />
    </ListPageLayout>
  );
};
