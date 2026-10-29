import { BarChart3,Heart,Search,Shield,UserPlus,Users } from 'lucide-react';
import React from 'react';
import { teamsService } from '../../../services/teamsService';
import { Badge,FormIndicator } from '../../common/Badge';
import { EmptyState } from '../../common/EmptyState';
import { EntityLink } from '../../common/EntityLink';
import { ImageUploadField } from '../../common/ImageUploadField';
import { ListError,ListPageLayout,Pagination } from '../../common/ListPage';
import { SelectField } from '../../common/SelectField';
import { CardSkeleton } from '../../common/Skeleton';
import { TeamsDialogs } from './TeamsDialogs';
import { useTeamsViewModel } from './useTeamsViewModel';

export const TeamsView: React.FC = () => {
  const model = useTeamsViewModel();
  const { showToast, user, navigateToResource, t, activeTab, setActiveTab, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, showFavoriteTeams, setShowFavoriteTeams, teamList, clubList, teams, clubs, setClubs, isLoading, updatingFavoriteTeamIds, setSelectedTeam, setRosterTab, setIsJoinModalOpen, updatingClubLogoId, setUpdatingClubLogoId, isTeamMember, visibleTeams, teamPage, clubPage, handleToggleFavorite } = model;

  return (
    <ListPageLayout>
      <ListError error={teamList.error || clubList.error} onRetry={() => { teamList.refresh(); clubList.refresh(); }} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            Équipes & Clubs
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Découvrez les clubs, consultez les effectifs complets et candidatez pour rejoindre un effectif.
          </p>
        </div>

        {/* Tab switcher: Équipes vs Clubs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-pitch-line rounded-2xl self-start md:self-auto shadow-2xs">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 min-h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-pitch-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Équipes ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-4 py-2 min-h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'clubs'
                ? 'bg-pitch-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clubs ({clubs.length})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              id="team-search"
              name="teamSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une équipe, un club, une ville..."
              className="w-full bg-pitch-input border border-pitch-line rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-pitch-ink placeholder-slate-400 focus:border-pitch-primary focus:bg-white transition-all outline-hidden"
            />
          </div>
          <div>
            <SelectField
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filtrer par catégorie d'équipe"
              className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary transition-colors outline-hidden"
            >
              <option value="Toutes">Toutes les catégories</option>
              <option value="Senior">Senior Masculin</option>
              <option value="U19">U19</option>
              <option value="U17">U17</option>
              <option value="Féminine">Féminine</option>
            </SelectField>
          </div>
          {user && <button
            type="button"
            aria-pressed={showFavoriteTeams}
            onClick={() => setShowFavoriteTeams((current) => !current)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors md:col-span-2 md:justify-start ${
              showFavoriteTeams
                ? 'border-pitch-primary bg-pitch-light text-pitch-primary'
                : 'border-pitch-line bg-white text-slate-600 hover:border-pitch-primary hover:text-pitch-primary'
            }`}
          >
            <Heart className={`h-4 w-4 ${showFavoriteTeams ? 'fill-current' : ''}`} aria-hidden="true" />
            Mes équipes favorites ({user?.favoriteTeamIds?.length ?? 0})
          </button>}
        </div>
      )}

      {/* Teams Grid (matching Screenshot 3) */}
      {activeTab === 'teams' ? (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : visibleTeams.length === 0 ? (
          <EmptyState
            icon={Shield}
            title={showFavoriteTeams ? 'Aucune équipe favorite' : 'Aucune équipe trouvée'}
            description={showFavoriteTeams ? 'Marquez une équipe avec le cœur pour la retrouver ici.' : "Modifiez vos critères pour explorer d'autres divisions."}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamPage.items.map((team) => {
              const isFav = user?.favoriteTeamIds?.includes(team.id) ?? false;
              const isMember = isTeamMember(team);
              return (
                <div
                  key={team.id}
                  onClick={() => navigateToResource('teams', team.id)}
                  onKeyDown={(event) => {
                    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      navigateToResource('teams', team.id);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`Voir l'équipe ${team.name}`}
                  className="rounded-3xl bg-white border border-pitch-line overflow-hidden shadow-xs hover:border-pitch-primary/50 transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-pitch-primary"
                >
                  <div>
                    {/* Header Image matching Screenshot 3 */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={team.coverUrl}
                        alt={team.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {/* Recrute Badge */}
                      {team.isRecruiting && (
                        <div className="absolute bottom-3 left-3">
                          <span className="px-3 py-1 rounded-full bg-lime-volt text-pitch-ink font-extrabold text-xs shadow-xs">
                            Recrute
                          </span>
                        </div>
                      )}
                      {/* Favorite Button */}
                      {user && <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleToggleFavorite(team.id);
                        }}
                        aria-label={isFav ? `Retirer ${team.name} de mes équipes favorites` : `Ajouter ${team.name} à mes équipes favorites`}
                        aria-pressed={isFav}
                        disabled={updatingFavoriteTeamIds.includes(team.id)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white hover:bg-black/60 transition-colors disabled:cursor-wait disabled:opacity-60"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                      </button>}
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Team Name and City */}
                      <div>
                        <h2 className="card-title text-xl font-extrabold text-pitch-ink tracking-tight">{team.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {team.clubName || team.name} · {team.city}
                        </p>
                      </div>

                      {/* Badges: Division + Membres count */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-pitch-light text-pitch-primary border border-[#d4e7d4]">
                          {team.division}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 text-slate-600 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{team.membersCount} membres</span>
                        </span>
                      </div>

                      {/* 5 derniers matchs: D D N V D as in screenshot 3 */}
                      <div className="pt-2 border-t border-pitch-separator flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">5 derniers matchs</span>
                        <div className="flex items-center gap-1.5">
                          {team.recentForm.map((result, idx) => (
                            <FormIndicator key={idx} result={result} size="md" />
                          ))}
                          {team.recentForm.length === 0 && <span className="text-caption text-slate-400">Aucun résultat</span>}
                        </div>
                      </div>

                      {/* Quick Links: Effectif + Stats & Buteurs */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRosterTab('members');
                            navigateToResource('teams', team.id);
                          }}
                          className="py-2 px-2 text-center text-xs font-bold text-pitch-primary bg-pitch-panel hover:bg-pitch-light border border-pitch-line rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Membres ({team.members.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRosterTab('stats');
                            navigateToResource('teams', team.id);
                          }}
                          className="py-2 px-2 text-center text-xs font-bold text-pitch-ink bg-pitch-panel hover:bg-pitch-light border border-pitch-line rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-pitch-primary" />
                          <span>Stats & Buteurs</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA button matching Screenshot 3: Demander à rejoindre */}
                  {!isMember && user && <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedTeam(team);
                        setIsJoinModalOpen(true);
                      }}
                      className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer btn-tactical"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Demander à rejoindre</span>
                    </button>
                  </div>}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Clubs Omnisports view */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubPage.items.map((club) => (
            <div
              key={club.id}
              className="p-6 rounded-3xl bg-white border border-pitch-line space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <img
                    src={club.logoUrl}
                    alt={club.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-slate-100 border border-pitch-line"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="card-title text-lg font-extrabold text-pitch-ink">{club.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fondé en {club.foundedYear} · {club.city}
                    </p>
                  </div>
                </div>
                <Badge variant="emerald" size="sm">
                  {club.teamsCount} équipes
                </Badge>
              </div>

              {club.canManageLogo && <ImageUploadField
                purpose="club-logo"
                label={updatingClubLogoId === club.id ? 'Enregistrement…' : 'Importer le logo du club'}
                disabled={updatingClubLogoId !== null}
                onUploaded={async (logoUrl) => {
                  setUpdatingClubLogoId(club.id);
                  try {
                    const updatedClub = await teamsService.updateClubLogo(club.id, logoUrl);
                    setClubs((current) => current.map((item) => item.id === updatedClub.id ? updatedClub : item));
                    showToast('Logo du club mis à jour.');
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : 'Impossible de modifier le logo du club.', 'error');
                  } finally {
                    setUpdatingClubLogoId(null);
                  }
                }}
              />}

              <div className="text-xs text-slate-600 space-y-1">
                <div>Stade officiel : <strong className="text-pitch-ink">{club.stadiumName}</strong></div>
                <div>Président : <strong className="text-pitch-ink">{club.presidentName}</strong> · {club.membersTotal} licenciés</div>
              </div>

              <div className="pt-3 border-t border-pitch-separator">
                <h3 className="card-title text-xs font-bold text-slate-400 mb-2">Sections & Équipes engagées :</h3>
                <div className="flex flex-wrap gap-2">
                  {club.teams.map((t) => (
                    <span
                      key={t.id}
                      className="text-xs px-3 py-1 rounded-full bg-[#f1f5ee] border border-[#dbe5d7] text-slate-700 font-semibold"
                    >
                      <EntityLink section="teams" id={t.id}>{t.name}</EntityLink> ({t.category})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination {...(activeTab === 'teams' ? teamPage : clubPage)} />
      <TeamsDialogs model={model} />
    </ListPageLayout>
  );
};
