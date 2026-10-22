import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Users, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ArrowRight, 
  Activity, 
  ChevronRight,
  Shield,
  Star,
  Clock,
  Send,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../../context/useApp';
import { matchesService } from '../../../services/matchesService';
import { recruitmentService } from '../../../services/recruitmentService';
import { pitchesService } from '../../../services/pitchesService';
import { playersService } from '../../../services/playersService';
import { teamsService } from '../../../services/teamsService';
import { Match, RecruitmentAd, Pitch, Player, Team, LeagueStandingRow, ActivityFeedItem, Application } from '../../../types';
import { Badge, FormIndicator } from '../../common/Badge';
import { Modal } from '../../common/Modal';

export const HomeView: React.FC = () => {
  const { navigateToResource, user, showToast } = useApp();
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [standings, setStandings] = useState<LeagueStandingRow[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [activeApplications, setActiveApplications] = useState<Application[]>([]);
  const [followedTeams, setFollowedTeams] = useState<Team[]>([]);
  const [featuredPlayers, setFeaturedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal for Team Roster & Relance
  const [isRelanceModalOpen, setIsRelanceModalOpen] = useState(false);
  const [relanceMessage, setRelanceMessage] = useState('Rappel match samedi 15h30 : Présence au vestiaire requise à 14h15 avec protège-tibias.');
  const [isSendingRelance, setIsSendingRelance] = useState(false);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [matches, team, stand, feed, apps, allTeams, players] = await Promise.all([
          matchesService.list(),
          teamsService.getMyTeam(),
          matchesService.getLeagueStandings(),
          matchesService.getActivityFeed(),
          recruitmentService.listMyApplications(),
          teamsService.list(),
          playersService.list(),
        ]);

        const live = matches.find((m) => m.status === 'LIVE') || matches[0];
        setLiveMatch(live || null);
        setMyTeam(team || null);
        setStandings(stand);
        setActivityFeed(feed);
        setActiveApplications(apps);
        setFollowedTeams(allTeams.slice(0, 3));
        setFeaturedPlayers(players.slice(0, 2));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error loading home data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleSendRelance = async () => {
    setIsSendingRelance(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsSendingRelance(false);
    setIsRelanceModalOpen(false);
    showToast(`Relance officielle et convocations transmises aux 20 membres de ${myTeam?.name} !`);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero: Prochain match de mon équipe & Relance d'effectif */}
      {myTeam && (
        <section aria-label="Espace Mon Équipe" className="rounded-3xl bg-white border border-[#dce6d8] shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 bg-gradient-to-r from-[#0d3822] via-[#0e4d2e] to-[#092c1a] text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Team brand and form */}
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c6f432]">
                  <span className="w-2 h-2 rounded-full bg-[#c6f432] animate-pulse" />
                  <span>MON ÉQUIPE OFFICIELLE · {myTeam.division}</span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src={myTeam.logoUrl}
                    alt={myTeam.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-white/10 border-2 border-[#c6f432] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                      {myTeam.name}
                    </h1>
                    <p className="text-xs text-slate-200 mt-0.5">
                      {myTeam.city} · Coach {myTeam.coachName} · {myTeam.membersCount} membres
                    </p>
                  </div>
                </div>

                {/* Forme des 5 derniers matchs: D D N V D */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-semibold text-slate-300">Forme récente :</span>
                  <div className="flex items-center gap-1.5">
                    {myTeam.recentForm.map((res, i) => (
                      <FormIndicator key={i} result={res} size="sm" />
                    ))}
                  </div>
                  <span className="text-xs text-[#c6f432] font-semibold ml-2">
                    {myTeam.stats.position}e au classement ({myTeam.stats.points} pts)
                  </span>
                </div>
              </div>

              {/* Next Match & Action Strip */}
              {myTeam.nextMatch && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 max-w-md w-full space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#c6f432] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      PROCHAIN MATCH À JOUER
                    </span>
                    <span className="text-slate-200">{myTeam.nextMatch.date} à {myTeam.nextMatch.time}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-extrabold text-white truncate">{myTeam.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#c6f432] px-2 py-0.5 rounded-md bg-black/30">
                      VS
                    </span>
                    <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                      <span className="text-sm font-extrabold text-white truncate">{myTeam.nextMatch.opponentName}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 truncate">
                    Lieu : {myTeam.nextMatch.venue}
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setIsRelanceModalOpen(true)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#c6f432] hover:bg-[#b5f22e] text-[#092c1a] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Relancer l&apos;équipe / Convoquer</span>
                    </button>
                    <button
                      onClick={() => navigateToResource('teams', myTeam.id)}
                      className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-colors cursor-pointer"
                    >
                      Effectif
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Grid: 2 Columns (Left: Candidatures & Activités, Right: Classement & Matchs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Application / Candidature active if any */}
          {activeApplications.length > 0 && (
            <section aria-label="Candidatures actives" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#0e5632]" />
                  <h2 className="text-base font-extrabold text-[#092c1a]">Candidature active en cours</h2>
                </div>
                <button
                  onClick={() => navigateToResource('recruitment')}
                  className="text-xs font-semibold text-[#0e5632] hover:underline"
                >
                  Voir tout
                </button>
              </div>

              {activeApplications.slice(0, 1).map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-white border border-[#dce6d8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#092c1a]">{app.adTitle}</h3>
                      <Badge variant={app.status === 'ACCEPTEE' ? 'emerald' : 'amber'} size="sm">
                        {app.status === 'EN_REVUE' ? 'En cours d’examen' : 'Retenu pour essai'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Club : <strong className="text-slate-800">{app.teamName}</strong> · Candidat : {app.applicantName} ({app.applicantPosition})
                    </p>
                    <p className="text-xs text-slate-600 italic">« {app.message} »</p>
                  </div>

                  <button
                    onClick={() => showToast('Message de relance envoyé au recruteur !')}
                    className="px-4 py-2 rounded-xl bg-[#eaf4ed] hover:bg-[#d5edd9] text-[#0e5632] text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Relancer le recruteur
                  </button>
                </div>
              ))}
            </section>
          )}

          {/* Featured Players Spotlight (matching user screenshot 2) */}
          <section aria-label="Joueurs à découvrir" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#092c1a]">Joueurs en vedette</h2>
                <p className="text-xs text-slate-500">Profils vérifiés avec CV sportif et statistiques</p>
              </div>
              <button
                onClick={() => navigateToResource('players')}
                className="text-xs font-bold text-[#0e5632] hover:text-[#093c23] flex items-center gap-1 cursor-pointer"
              >
                <span>Explorer les joueurs</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="rounded-2xl bg-white border border-[#dce6d8] overflow-hidden shadow-xs hover:border-[#0e5632]/50 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#c6f432] text-[#c6f432]" />
                      <span>{player.rating || 7.8}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[#092c1a]">{player.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {player.primaryPosition} · {player.age} ans
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="emerald" size="sm">Disponible</Badge>
                      <Badge variant="slate" size="sm">{player.level}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-[#edf3ea]">
                      <span className="truncate">{player.currentTeam} · {player.city}</span>
                      <span className="font-extrabold text-[#0e5632] shrink-0">🎯 {player.goals} buts</span>
                    </div>

                    <button
                      onClick={() => {
                        showToast(`Invitation transmise à ${player.name} !`);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#0e5632] hover:bg-[#0a3d24] text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Inviter dans mon équipe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Live Activity Feed / Activité récente */}
          <section aria-label="Activité récente" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#092c1a]">Activité récente sur Footera</h2>
              <span className="text-xs text-slate-400">Temps réel</span>
            </div>

            <div className="space-y-2.5">
              {activityFeed.map((act) => (
                <div
                  key={act.id}
                  onClick={() => navigateToResource(act.targetSection as any)}
                  className="p-4 rounded-2xl bg-white border border-[#dce6d8] hover:border-[#0e5632]/40 transition-all cursor-pointer shadow-2xs flex items-start gap-3.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] flex items-center justify-center text-[#0e5632] shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-[#092c1a]">{act.title}</h3>
                      <span className="text-[10px] text-slate-400">{act.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{act.description}</p>
                  </div>
                  <Badge variant="lime" size="sm">{act.badgeText}</Badge>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Standings & Followed Teams */}
        <div className="space-y-8">
          {/* Official League Standings Table */}
          <section aria-label="Classement du championnat" className="p-5 rounded-3xl bg-white border border-[#dce6d8] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#092c1a]">Classement Régional 2</h2>
                <p className="text-[11px] text-slate-500">Saison régulière 2026</p>
              </div>
              <Trophy className="w-4 h-4 text-[#0e5632]" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 border-b border-[#edf3ea] uppercase font-bold">
                  <tr>
                    <th className="pb-2">#</th>
                    <th className="pb-2">Équipe</th>
                    <th className="pb-2 text-center">MJ</th>
                    <th className="pb-2 text-center">Diff</th>
                    <th className="pb-2 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ea] tabular-nums font-medium text-slate-700">
                  {standings.map((teamRow) => {
                    const isMyTeamRow = teamRow.teamId === 'team_betsileo';
                    return (
                      <tr
                        key={teamRow.teamId}
                        className={`transition-colors ${
                          isMyTeamRow ? 'bg-[#eaf4ed] font-bold text-[#092c1a]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 font-bold text-slate-500">{teamRow.position}</td>
                        <td className="py-2.5 font-semibold truncate max-w-[120px] text-[#092c1a]">
                          {teamRow.teamName}
                        </td>
                        <td className="py-2.5 text-center text-slate-500">{teamRow.played}</td>
                        <td className="py-2.5 text-center text-slate-600">
                          {teamRow.goalDifference > 0 ? `+${teamRow.goalDifference}` : teamRow.goalDifference}
                        </td>
                        <td className="py-2.5 text-right font-extrabold text-[#0e5632]">
                          {teamRow.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => navigateToResource('matches')}
              className="w-full py-2 text-center text-xs font-bold text-[#0e5632] hover:bg-[#eaf4ed] rounded-xl transition-colors cursor-pointer"
            >
              Consulter le calendrier complet →
            </button>
          </section>

          {/* Followed Teams / Équipes suivies */}
          <section aria-label="Équipes suivies" className="p-5 rounded-3xl bg-white border border-[#dce6d8] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#092c1a]">Équipes suivies</h2>
              <Shield className="w-4 h-4 text-[#0e5632]" />
            </div>

            <div className="space-y-3">
              {followedTeams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => navigateToResource('teams', team.id)}
                  className="p-3 rounded-2xl bg-[#f8faf7] border border-[#e2ebe0] hover:border-[#0e5632]/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="w-9 h-9 rounded-xl object-cover bg-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-[#092c1a] truncate">{team.name}</h3>
                      <p className="text-[10px] text-slate-500 truncate">{team.city} · {team.division}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Relance Modal */}
      {isRelanceModalOpen && myTeam && (
        <Modal
          isOpen={isRelanceModalOpen}
          onClose={() => setIsRelanceModalOpen(false)}
          title={`Relance officielle — ${myTeam.name}`}
          subtitle={`Convocations pour le match face à ${myTeam.nextMatch?.opponentName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Ce message sera envoyé en notification prioritaire aux <strong>{myTeam.membersCount} membres</strong> de l&apos;équipe.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consigne & Convocation de match *
              </label>
              <textarea
                rows={4}
                value={relanceMessage}
                onChange={(e) => setRelanceMessage(e.target.value)}
                className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsRelanceModalOpen(false)}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSendRelance}
                disabled={isSendingRelance}
                className="px-5 py-2 min-h-[44px] rounded-xl bg-[#0e5632] hover:bg-[#0a3d24] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingRelance ? 'Envoi en cours...' : 'Diffuser la relance'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
