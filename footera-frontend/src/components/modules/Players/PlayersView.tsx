import { Search,UserPlus } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../common/EmptyState';
import { FavoriteButton } from '../../common/FavoriteButton';
import { ListError,ListPageLayout,Pagination } from '../../common/ListPage';
import { SelectField } from '../../common/SelectField';
import { CardSkeleton } from '../../common/Skeleton';
import { PlayersDialogs } from './PlayersDialogs';
import { usePlayersViewModel } from './usePlayersViewModel';

export const PlayersView: React.FC = () => {
  const navigate = useNavigate();
  const model = usePlayersViewModel();
  const { t, navigateToResource, levels, myTeam, isLoadingMyTeam, searchQuery, setSearchQuery, selectedPosition, setSelectedPosition, selectedLevel, setSelectedLevel, onlyTransfer, setOnlyTransfer, onlyFavorites, setOnlyFavorites, list, players, isLoading, page, detail, setSelectedPlayer, setIsInviteOpen, invitationStatuses, positionsList } = model;

  return (
    <ListPageLayout>
      <ListError error={list.error || detail.error} onRetry={() => { list.refresh(); detail.refresh(); }} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            {t('players.pageTitle')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {t('players.resultsCount', { count: players.length })}
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-pitch-ink bg-white border border-pitch-line px-3.5 py-2 rounded-2xl cursor-pointer hover:border-pitch-primary transition-colors shadow-2xs self-start md:self-auto">
          <input
            type="checkbox"
            checked={onlyTransfer}
            onChange={(e) => setOnlyTransfer(e.target.checked)}
            className="rounded text-pitch-primary focus:ring-pitch-primary border-pitch-line"
          />
          <span>{t('players.transferOnly')}</span>
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('players.searchPlaceholder')}
              className="w-full bg-pitch-input border border-pitch-line rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-pitch-ink placeholder-slate-400 focus:border-pitch-primary focus:bg-white transition-all outline-hidden"
            />
          </div>

          <div>
            <SelectField
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              aria-label={t('players.filterPosition')}
              className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary transition-colors outline-hidden"
            >
              {positionsList.map((p) => (
                <option key={p} value={p}>
                  {p === 'Toutes' ? t('players.allPositions') : p}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <SelectField
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              aria-label={t('players.filterLevel')}
              className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary transition-colors outline-hidden"
            >
              <option value="Tous">{t('players.allLevels')}</option>
              {levels.map((level) => <option key={level} value={level}>{level}</option>)}
            </SelectField>
          </div>
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={onlyFavorites} onChange={(event) => setOnlyFavorites(event.target.checked)} />{t('list.favorites')}</label>
      {/* Players Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : page.total === 0 ? (
        <EmptyState
          icon={Search}
          title={t('players.emptyTitle')}
          description={t('players.emptyDescription')}
          actionLabel={t('players.resetFilters')}
          onAction={() => navigate('/players', { replace: true })}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {page.items.map((player) => {
            const invitationStatus = invitationStatuses[player.id];
            const invitationButtonLabel = invitationStatus === 'PENDING'
              ? t('players.invitationPending')
              : invitationStatus === 'ACCEPTED'
                ? t('players.invitationAccepted')
                : invitationStatus === 'DECLINED'
                  ? t('players.invitationDeclined')
                  : t('players.inviteToTeam');
            return (
              <div
                key={player.id}
                onClick={() => navigateToResource('players', player.id)}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    navigateToResource('players', player.id);
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={t('players.viewProfile', { name: player.name })}
                className="rounded-3xl bg-white border border-pitch-line overflow-hidden shadow-xs hover:border-pitch-primary/50 transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-pitch-primary"
              >
                <div>
                  {/* Photo matching Screenshot 2 */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute right-3 top-3"><FavoriteButton entity="players" id={player.id} /></div>
                  </div>

                  <div className="p-5 space-y-3.5">
                    {/* Player Name and Position · Age */}
                    <div>
                      <h2 className="card-title text-xl font-extrabold text-pitch-ink tracking-tight">{player.name}</h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {player.primaryPosition} · {player.age ? t('profile.ageYears', { age: player.age }) : t('players.ageUnknown')}
                      </p>
                    </div>

                    {/* Badges: Disponible / Régional */}
                    <div className="flex items-center gap-2">
                      {player.isAvailableForTransfer ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                          {t('players.availableStatus')}
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          {t('players.contracted')}
                        </span>
                      )}
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]">
                        {player.level}
                      </span>
                    </div>

                    {/* Team info & goals count */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-pitch-separator">
                      <span className="truncate">{player.currentTeam || t('players.noClub')} · {player.city}</span>
                      <span className="font-extrabold text-pitch-primary flex items-center gap-1 shrink-0">
                        <span>🎯</span>
                        <span>{t('players.goals', { count: player.goals })}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Button matching Screenshot 2: Inviter dans mon équipe */}
                {myTeam && !isLoadingMyTeam && <div className="p-5 pt-0">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      if (invitationStatus === 'PENDING') return;
                      setSelectedPlayer(player);
                      setIsInviteOpen(true);
                    }}
                    disabled={invitationStatus === 'PENDING'}
                    className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer btn-tactical disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{invitationButtonLabel}</span>
                  </button>
                </div>}
              </div>
            );
          })}
        </div>
      )}

      <Pagination {...page} />
      <PlayersDialogs model={model} />
    </ListPageLayout>
  );
};
