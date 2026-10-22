import React, { useState, useEffect } from 'react';
import { Search, Shield, Users, Trophy, UserPlus, MapPin, Heart, ChevronRight, User, Target, Sparkles, BarChart3 } from 'lucide-react';
import { teamsService } from '../../../services/teamsService';
import { statsService } from '../../../services/statsService';
import { Team, Club, TeamMember, TopScorerItem, TopAssisterItem } from '../../../types';
import { Badge, FormIndicator } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { useApp } from '../../../context/AppContext';

export const TeamsView: React.FC = () => {
  const { showToast, selectedResourceId, toggleFavoriteTeam, user } = useApp();
  const [activeTab, setActiveTab] = useState<'teams' | 'clubs'>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Toutes');

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
          if (match) setSelectedTeam(match);
        }
      } catch (err: any) {
        showToast(err.message || 'Erreur lors du chargement des équipes', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [searchQuery, categoryFilter, selectedResourceId, showToast]);

  useEffect(() => {
    if (selectedTeam) {
      statsService.getTopScorers({ teamId: selectedTeam.id }).then(setTeamScorers);
      statsService.getTopAssisters({ teamId: selectedTeam.id }).then(setTeamAssisters);
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
    } catch (e: any) {
      showToast(e.message || 'Impossible de rejoindre l’équipe', 'error');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#092c1a] tracking-tight">
            Équipes & Clubs
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Découvrez les clubs, consultez les effectifs complets et candidatez pour rejoindre un effectif.
          </p>
        </div>

        {/* Tab switcher: Équipes vs Clubs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#dce6d8] rounded-2xl self-start md:self-auto shadow-2xs">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 min-h-[44px] text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-[#0e5632] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Équipes ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-4 py-2 min-h-[44px] text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'clubs'
                ? 'bg-[#0e5632] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clubs ({clubs.length})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-3xl bg-white border border-[#dce6d8] shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une équipe, un club, une ville..."
              className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-[#092c1a] placeholder-slate-400 focus:border-[#0e5632] focus:bg-white transition-all outline-hidden"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filtrer par catégorie d'équipe"
              className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-full px-4 py-2.5 text-xs md:text-sm text-[#092c1a] focus:border-[#0e5632] transition-colors outline-hidden"
            >
              <option value="Toutes">Toutes les catégories</option>
              <option value="Senior">Senior Masculin</option>
              <option value="U19">U19</option>
              <option value="U17">U17</option>
              <option value="Féminine">Féminine</option>
            </select>
          </div>
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
        ) : teams.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Aucune équipe trouvée"
            description="Modifiez vos critères pour explorer d'autres divisions."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const isFav = user?.favoriteTeamIds.includes(team.id);
              return (
                <div
                  key={team.id}
                  className="rounded-3xl bg-white border border-[#dce6d8] overflow-hidden shadow-xs hover:border-[#0e5632]/50 transition-all flex flex-col justify-between"
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
                          <span className="px-3 py-1 rounded-full bg-[#c6f432] text-[#092c1a] font-extrabold text-xs shadow-xs">
                            Recrute
                          </span>
                        </div>
                      )}
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteTeam(team.id);
                        }}
                        aria-label="Ajouter aux favoris"
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Team Name and City */}
                      <div>
                        <h2 className="text-xl font-extrabold text-[#092c1a] tracking-tight">{team.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {team.clubName || team.name} · {team.city}
                        </p>
                      </div>

                      {/* Badges: Division + Membres count */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#eaf4ed] text-[#0e5632] border border-[#d4e7d4]">
                          {team.division}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 text-slate-600 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{team.membersCount} membres</span>
                        </span>
                      </div>

                      {/* 5 derniers matchs: D D N V D as in screenshot 3 */}
                      <div className="pt-2 border-t border-[#edf3ea] flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">5 derniers matchs</span>
                        <div className="flex items-center gap-1.5">
                          {team.recentForm.map((result, idx) => (
                            <FormIndicator key={idx} result={result} size="md" />
                          ))}
                        </div>
                      </div>

                      {/* Quick Links: Effectif + Stats & Buteurs */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeam(team);
                            setRosterTab('members');
                            setIsRosterModalOpen(true);
                          }}
                          className="py-2 px-2 text-center text-xs font-bold text-[#0e5632] bg-[#f8faf7] hover:bg-[#eaf4ed] border border-[#dce6d8] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Membres ({team.members.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeam(team);
                            setRosterTab('stats');
                            setIsRosterModalOpen(true);
                          }}
                          className="py-2 px-2 text-center text-xs font-bold text-[#092c1a] bg-[#f8faf7] hover:bg-[#eaf4ed] border border-[#dce6d8] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-[#0e5632]" />
                          <span>Stats & Buteurs</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA button matching Screenshot 3: Demander à rejoindre */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setIsJoinModalOpen(true);
                      }}
                      className="w-full py-3.5 rounded-2xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-extrabold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer btn-tactical"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Demander à rejoindre</span>
                    </button>
                  </div>
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
              className="p-6 rounded-3xl bg-white border border-[#dce6d8] space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <img
                    src={club.logoUrl}
                    alt={club.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-slate-100 border border-[#dce6d8]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-lg font-extrabold text-[#092c1a]">{club.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fondé en {club.foundedYear} · {club.city}
                    </p>
                  </div>
                </div>
                <Badge variant="emerald" size="sm">
                  {club.teamsCount} équipes
                </Badge>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>Stade officiel : <strong className="text-[#092c1a]">{club.stadiumName}</strong></div>
                <div>Président : <strong className="text-[#092c1a]">{club.presidentName}</strong> · {club.membersTotal} licenciés</div>
              </div>

              <div className="pt-3 border-t border-[#edf3ea]">
                <h3 className="text-xs font-bold text-slate-400 mb-2">Sections & Équipes engagées :</h3>
                <div className="flex flex-wrap gap-2">
                  {club.teams.map((t) => (
                    <span
                      key={t.id}
                      className="text-xs px-3 py-1 rounded-full bg-[#f1f5ee] border border-[#dbe5d7] text-slate-700 font-semibold"
                    >
                      {t.name} ({t.category})
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
          onClose={() => setIsRosterModalOpen(false)}
          title={`Effectif officiel — ${selectedTeam.name}`}
          subtitle={`${selectedTeam.members.length} joueurs inscrits · Coach ${selectedTeam.coachName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl">
              <button
                type="button"
                onClick={() => setRosterTab('members')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rosterTab === 'members'
                    ? 'bg-[#0e5632] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#092c1a]'
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
                    ? 'bg-[#0e5632] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#092c1a]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Buteurs & Stats Club</span>
              </button>
            </div>

            {rosterTab === 'members' && (
              <div className="divide-y divide-[#edf3ea] max-h-[50vh] overflow-y-auto pr-1">
                {selectedTeam.members.map((member) => (
                  <div
                    key={member.playerId}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center font-extrabold text-sm text-[#0e5632] tabular-nums">
                        #{member.jerseyNumber}
                      </span>
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#092c1a]">{member.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {member.position} {member.age && `· ${member.age} ans`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'Capitaine' ? 'lime' : 'slate'} size="sm">
                        {member.role}
                      </Badge>
                      {member.goals !== undefined && member.goals > 0 && (
                        <span className="text-xs font-bold text-[#0e5632] px-2 py-0.5 rounded-full bg-[#e8f5e6]">
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
                  <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                    <span className="text-[10px] text-slate-400 block font-medium">Bilan</span>
                    <strong className="text-sm font-black text-[#092c1a]">
                      {selectedTeam.stats.wins}V · {selectedTeam.stats.draws}N · {selectedTeam.stats.losses}D
                    </strong>
                    <span className="text-[10px] text-[#0e5632] block font-semibold mt-0.5">
                      {selectedTeam.stats.points} Points
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#e8f5e6] border border-[#d4e7d4]">
                    <span className="text-[10px] text-[#0e5632] block font-semibold">Attaque</span>
                    <strong className="text-base font-black text-[#0e5632] tabular-nums">
                      {selectedTeam.stats.goalsFor} buts
                    </strong>
                    <span className="text-[10px] text-slate-600 block mt-0.5">
                      {(selectedTeam.stats.goalsFor / (selectedTeam.stats.matchesPlayed || 1)).toFixed(1)} / match
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                    <span className="text-[10px] text-slate-400 block font-medium">Défense</span>
                    <strong className="text-base font-black text-rose-600 tabular-nums">
                      {selectedTeam.stats.goalsAgainst} concédés
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Diff : {selectedTeam.stats.goalsFor - selectedTeam.stats.goalsAgainst > 0 ? `+${selectedTeam.stats.goalsFor - selectedTeam.stats.goalsAgainst}` : selectedTeam.stats.goalsFor - selectedTeam.stats.goalsAgainst}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                    <span className="text-[10px] text-slate-400 block font-medium">Rang</span>
                    <strong className="text-base font-black text-[#092c1a] tabular-nums">
                      #{selectedTeam.stats.position}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {selectedTeam.division}
                    </span>
                  </div>
                </div>

                {/* Top scorers of the team */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#092c1a] flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#0e5632]" />
                    <span>Meilleurs buteurs de l&apos;équipe</span>
                  </h4>
                  <div className="rounded-2xl border border-[#dce6d8] overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#f8faf7] text-slate-500 font-bold border-b border-[#edf3ea]">
                        <tr>
                          <th className="py-2 px-3">Joueur</th>
                          <th className="py-2 px-3 text-center">Poste</th>
                          <th className="py-2 px-3 text-center text-[#0e5632] font-black">Buts</th>
                          <th className="py-2 px-3 text-center">Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf3ea]">
                        {teamScorers.slice(0, 5).map((s) => (
                          <tr key={s.playerId} className="hover:bg-[#f6f9f5]">
                            <td className="py-2 px-3 font-extrabold text-[#092c1a]">
                              <div className="flex items-center gap-2">
                                <img src={s.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                <span>{s.playerName}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">{s.position}</td>
                            <td className="py-2 px-3 text-center font-black text-[#0e5632] tabular-nums">
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
                  <h4 className="text-xs font-bold text-[#092c1a] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0e5632]" />
                    <span>Meilleurs passeurs de l&apos;équipe</span>
                  </h4>
                  <div className="rounded-2xl border border-[#dce6d8] overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#f8faf7] text-slate-500 font-bold border-b border-[#edf3ea]">
                        <tr>
                          <th className="py-2 px-3">Passeur</th>
                          <th className="py-2 px-3 text-center">Poste</th>
                          <th className="py-2 px-3 text-center text-[#0e5632] font-black">Passes</th>
                          <th className="py-2 px-3 text-center">Clés</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf3ea]">
                        {teamAssisters.slice(0, 5).map((a) => (
                          <tr key={a.playerId} className="hover:bg-[#f6f9f5]">
                            <td className="py-2 px-3 font-extrabold text-[#092c1a]">
                              <div className="flex items-center gap-2">
                                <img src={a.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                <span>{a.playerName}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">{a.position}</td>
                            <td className="py-2 px-3 text-center font-black text-[#0e5632] tabular-nums">
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

            <div className="pt-3 border-t border-[#edf3ea]">
              <button
                onClick={() => {
                  setIsRosterModalOpen(false);
                  setIsJoinModalOpen(true);
                }}
                className="w-full py-3 rounded-2xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Rejoindre cet effectif</span>
              </button>
            </div>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Message au staff technique *
              </label>
              <textarea
                rows={4}
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Ex: Bonjour coach, je suis disponible pour les entraînements et souhaite intégrer l'équipe..."
                className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleJoinTeam}
                disabled={!joinMessage.trim() || isSubmittingJoin}
                className="px-5 py-2 min-h-[44px] rounded-xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
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
