import React, { useState, useEffect } from 'react';
import { SelectField } from '../../common/SelectField';
import { Search, Shield, Users, Trophy, UserPlus, MapPin, Heart, ChevronRight, User, Target, Sparkles, BarChart3 } from 'lucide-react';
import { teamsService } from '../../../services/teamsService';
import { statsService } from '../../../services/statsService';
import { Team, Club, TeamMember, TopScorerItem, TopAssisterItem } from '../../../types';
import { Badge, FormIndicator } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { EntityLink } from '../../common/EntityLink';
import { useApp } from '../../../context/useApp';
import { useSearchParams } from 'react-router-dom';
import { formatFiniteNumber } from '../../../utils/numberFormat';
import { ImageUploadField } from '../../common/ImageUploadField';

export const TeamsView: React.FC = () => {
  const { showToast, selectedResourceId, toggleFavoriteTeam, user, navigateToResource } = useApp();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'teams' | 'clubs'>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('query') ?? '');
  const [categoryFilter, setCategoryFilter] = useState('Toutes');
  const [showFavoriteTeams, setShowFavoriteTeams] = useState(false);
  const [updatingFavoriteTeamIds, setUpdatingFavoriteTeamIds] = useState<string[]>([]);

  // Detail Modal & Members Roster Modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterTab, setRosterTab] = useState<'members' | 'stats'>('members');
  const [teamScorers, setTeamScorers] = useState<TopScorerItem[]>([]);
  const [teamAssisters, setTeamAssisters] = useState<TopAssisterItem[]>([]);

  // Join Team Modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [updatingClubLogoId, setUpdatingClubLogoId] = useState<string | null>(null);

  const isTeamMember = (team: Team) => Boolean(user && team.members?.some((member) => member.playerId === user.id));
  const visibleTeams = showFavoriteTeams
    ? teams.filter((team) => user?.favoriteTeamIds?.includes(team.id))
    : teams;

  const handleToggleFavorite = async (teamId: string) => {
    if (updatingFavoriteTeamIds.includes(teamId)) return;
    setUpdatingFavoriteTeamIds((current) => [...current, teamId]);
    try {
      await toggleFavoriteTeam(teamId);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Impossible de mettre à jour vos équipes favorites.', 'error');
    } finally {
      setUpdatingFavoriteTeamIds((current) => current.filter((id) => id !== teamId));
    }
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [teamsData, clubsData] = await Promise.all([
          teamsService.list({ query: searchQuery, category: categoryFilter }),
          teamsService.listClubs(),
        ]);
        setTeams(teamsData);
        setClubs(clubsData);

        if (selectedResourceId) {
          const match = teamsData.find((t) => t.id === selectedResourceId);
          if (match) {
            setSelectedTeam(match);
            setIsRosterModalOpen(true);
          }
        }
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Erreur lors du chargement des équipes', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [searchQuery, categoryFilter, selectedResourceId, showToast]);

  useEffect(() => {
    if (selectedTeam) {
      statsService.getTopScorers({ teamId: selectedTeam.id, limit: 5 }).then(setTeamScorers);
      statsService.getTopAssisters({ teamId: selectedTeam.id, limit: 5 }).then(setTeamAssisters);
    }
  }, [selectedTeam?.id]);

  const handleJoinTeam = async () => {
    if (!selectedTeam) return;
    setIsSubmittingJoin(true);
    try {
      const res = await teamsService.joinTeam(selectedTeam.id, joinMessage);
      if (res.success) {
        showToast(res.message);
        setIsJoinModalOpen(false);
        setJoinMessage('');
        const updated = await teamsService.getById(selectedTeam.id);
        setSelectedTeam(updated);
      } else {
        showToast(res.message, 'error');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Impossible de rejoindre l’équipe', 'error');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
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
            {visibleTeams.map((team) => {
              const isFav = user?.favoriteTeamIds?.includes(team.id) ?? false;
              const isMember = isTeamMember(team);
              return (
                <div
                  key={team.id}
                  onClick={() => navigateToResource('teams', team.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
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
                        <h2 className="text-xl font-extrabold text-pitch-ink tracking-tight">{team.name}</h2>
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
          {clubs.map((club) => (
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
                    <h2 className="text-lg font-extrabold text-pitch-ink">{club.name}</h2>
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
                <h3 className="text-xs font-bold text-slate-400 mb-2">Sections & Équipes engagées :</h3>
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

      {/* Roster / Membres de l'équipe Modal */}
      {isRosterModalOpen && selectedTeam && (
        <Modal
          isOpen={isRosterModalOpen}
          onClose={() => {
            setIsRosterModalOpen(false);
            setSelectedTeam(null);
            navigateToResource('teams');
          }}
          title={`Effectif officiel — ${selectedTeam.name}`}
          subtitle={`${selectedTeam.members.length} joueurs inscrits · Coach ${selectedTeam.coachName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-pitch-panel border border-pitch-line rounded-2xl">
              <button
                type="button"
                onClick={() => setRosterTab('members')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rosterTab === 'members'
                    ? 'bg-pitch-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-pitch-ink'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Effectif ({selectedTeam.members.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRosterTab('stats')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rosterTab === 'stats'
                    ? 'bg-pitch-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-pitch-ink'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Buteurs & Stats Club</span>
              </button>
            </div>

            {rosterTab === 'members' && (
              <div className="divide-y divide-pitch-separator max-h-[50vh] overflow-y-auto pr-1">
                {selectedTeam.members.map((member) => (
                  <div
                    key={member.playerId}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center font-extrabold text-sm text-pitch-primary tabular-nums">
                        #{member.jerseyNumber}
                      </span>
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-pitch-ink"><EntityLink section="players" id={member.playerId}>{member.name}</EntityLink></h4>
                        <p className="text-caption text-slate-500">
                          {member.position} {member.age && `· ${member.age} ans`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'Capitaine' ? 'lime' : 'slate'} size="sm">
                        {member.role}
                      </Badge>
                      {member.goals !== undefined && member.goals > 0 && (
                        <span className="text-xs font-bold text-pitch-primary px-2 py-0.5 rounded-full bg-[#e8f5e6]">
                          🎯 {member.goals} buts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rosterTab === 'stats' && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {/* Team metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-micro text-slate-400 block font-medium">Bilan</span>
                    <strong className="text-sm font-black text-pitch-ink">
                      {selectedTeam.stats.wins}V · {selectedTeam.stats.draws}N · {selectedTeam.stats.losses}D
                    </strong>
                    <span className="text-micro text-pitch-primary block font-semibold mt-0.5">
                      {selectedTeam.stats.points} Points
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#e8f5e6] border border-[#d4e7d4]">
                    <span className="text-micro text-pitch-primary block font-semibold">Attaque</span>
                    <strong className="text-base font-black text-pitch-primary tabular-nums">
                      {selectedTeam.stats.goalsFor} buts
                    </strong>
                    <span className="text-micro text-slate-600 block mt-0.5">
                      {formatFiniteNumber(selectedTeam.stats.goalsPerMatch, 1)} / match
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-micro text-slate-400 block font-medium">Défense</span>
                    <strong className="text-base font-black text-rose-600 tabular-nums">
                      {selectedTeam.stats.goalsAgainst} concédés
                    </strong>
                    <span className="text-micro text-slate-500 block mt-0.5">
                      Diff : {selectedTeam.stats.goalDifference > 0 ? `+${selectedTeam.stats.goalDifference}` : selectedTeam.stats.goalDifference}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-micro text-slate-400 block font-medium">Rang</span>
                    <strong className="text-base font-black text-pitch-ink tabular-nums">
                      #{selectedTeam.stats.position}
                    </strong>
                    <span className="text-micro text-slate-500 block mt-0.5">
                      {selectedTeam.division}
                    </span>
                  </div>
                </div>

                {/* Top scorers of the team */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-pitch-ink flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-pitch-primary" />
                    <span>Meilleurs buteurs de l&apos;équipe</span>
                  </h4>
                  <div className="rounded-2xl border border-pitch-line overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-pitch-panel text-slate-500 font-bold border-b border-pitch-separator">
                        <tr>
                          <th className="py-2 px-3">Joueur</th>
                          <th className="py-2 px-3 text-center">Poste</th>
                          <th className="py-2 px-3 text-center text-pitch-primary font-black">Buts</th>
                          <th className="py-2 px-3 text-center">Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pitch-separator">
                      {teamScorers.map((s) => (
                          <tr key={s.playerId} className="hover:bg-[#f6f9f5]">
                            <td className="py-2 px-3 font-extrabold text-pitch-ink">
                              <div className="flex items-center gap-2">
                                <img src={s.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                <EntityLink section="players" id={s.playerId}>{s.playerName}</EntityLink>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">{s.position}</td>
                            <td className="py-2 px-3 text-center font-black text-pitch-primary tabular-nums">
                              {s.goals}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700 tabular-nums">
                              {s.ratio}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top assisters of the team */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-pitch-ink flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pitch-primary" />
                    <span>Meilleurs passeurs de l&apos;équipe</span>
                  </h4>
                  <div className="rounded-2xl border border-pitch-line overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-pitch-panel text-slate-500 font-bold border-b border-pitch-separator">
                        <tr>
                          <th className="py-2 px-3">Passeur</th>
                          <th className="py-2 px-3 text-center">Poste</th>
                          <th className="py-2 px-3 text-center text-pitch-primary font-black">Passes</th>
                          <th className="py-2 px-3 text-center">Clés</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pitch-separator">
                      {teamAssisters.map((a) => (
                          <tr key={a.playerId} className="hover:bg-[#f6f9f5]">
                            <td className="py-2 px-3 font-extrabold text-pitch-ink">
                              <div className="flex items-center gap-2">
                                <img src={a.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                <EntityLink section="players" id={a.playerId}>{a.playerName}</EntityLink>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">{a.position}</td>
                            <td className="py-2 px-3 text-center font-black text-pitch-primary tabular-nums">
                              {a.assists}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700 tabular-nums">
                              {a.keyPasses}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {!isTeamMember(selectedTeam) && user && <div className="pt-3 border-t border-pitch-separator">
              <button
                onClick={() => {
                  setIsRosterModalOpen(false);
                  setIsJoinModalOpen(true);
                }}
                className="w-full py-3 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Rejoindre cet effectif</span>
              </button>
            </div>}
          </div>
        </Modal>
      )}

      {/* Join Team Modal */}
      {isJoinModalOpen && selectedTeam && (
        <Modal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          title={`Rejoindre ${selectedTeam.name}`}
          subtitle={`Demande d'adhésion pour la division ${selectedTeam.division}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Votre CV sportif ({user?.sportsCv.primaryPosition}, {user?.sportsCv.height}cm, {user?.sportsCv.strongFoot}) sera directement envoyé au coach <strong>{selectedTeam.coachName}</strong>.
            </p>
            <div>
              <label htmlFor="team-join-message" className="block text-xs font-bold text-slate-700 mb-1">
                Message au staff technique *
              </label>
              <textarea
                id="team-join-message"
                name="message"
                rows={4}
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Ex: Bonjour coach, je suis disponible pour les entraînements et souhaite intégrer l'équipe..."
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleJoinTeam}
                disabled={!joinMessage.trim() || isSubmittingJoin}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmittingJoin ? 'Envoi...' : 'Envoyer ma demande'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
