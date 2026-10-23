import React, { useEffect, useState } from 'react';
import { SelectField } from '../../common/SelectField';
import { ArrowLeft, CalendarDays, MapPin, Shield, Trophy, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { teamsService } from '../../../services/teamsService';
import { TeamDetail, TeamMatch } from '../../../types';
import { Badge, FormIndicator } from '../../common/Badge';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { EntityLink } from '../../common/EntityLink';
import { useApp } from '../../../context/useApp';

const MatchCard: React.FC<{ match: TeamMatch; onOpen: (id: string) => void }> = ({ match, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(match.id)}
    className="w-full cursor-pointer rounded-2xl border border-pitch-line bg-white p-4 text-left shadow-xs focus-visible:outline-2 focus-visible:outline-pitch-primary sm:p-5"
    aria-label={`Voir le match ${match.homeTeam.name} contre ${match.awayTeam.name}`}
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-bold text-pitch-ink">{match.competition}</span>
      <Badge variant={match.status === 'SCHEDULED' ? 'amber' : 'slate'} size="sm">
        {match.status === 'SCHEDULED' ? 'À venir' : 'Terminé'}
      </Badge>
    </div>
    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-pitch-ink">
        <img src={match.homeTeam.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
        <span className="truncate">{match.homeTeam.name}</span>
      </span>
      <span className="text-center text-sm font-black tabular-nums text-pitch-primary">
        {match.status === 'SCHEDULED' ? `${match.date} · ${match.time}` : `${match.homeTeam.score} - ${match.awayTeam.score}`}
      </span>
      <span className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-bold text-pitch-ink">
        <span className="truncate">{match.awayTeam.name}</span>
        <img src={match.awayTeam.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
      </span>
    </div>
    <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{match.pitchName || match.venue}{match.city ? ` · ${match.city}` : ''}</span>
    </p>
    {match.goalScorers.length > 0 ? (
      <div className="mt-3 border-t border-pitch-separator pt-3">
        <p className="text-caption font-bold uppercase tracking-wide text-slate-500">Buteurs</p>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {match.goalScorers.map((goal, index) => (
            <li key={`${goal.minute}-${goal.teamId}-${index}`} className="text-xs text-slate-600">
              <span className="font-bold text-pitch-primary">{goal.minute}&apos;</span>{' '}
              {goal.teamId === match.homeTeam.id ? <strong className="text-pitch-ink">{goal.player}</strong> : goal.player}
              {goal.assist ? <span className="text-slate-500"> (passe : {goal.assist})</span> : null}
            </li>
          ))}
        </ul>
      </div>
    ) : match.status === 'SCHEDULED' ? (
      <p className="mt-3 border-t border-pitch-separator pt-3 text-xs text-slate-600">Buteurs du match : à renseigner après la rencontre.</p>
    ) : null}
    <div className="mt-3 flex items-center justify-between border-t border-pitch-separator pt-3 text-xs">
      <span className="text-slate-500">{match.isHome ? 'À domicile' : 'À l’extérieur'} · {match.venue}</span>
      <span className="font-bold text-pitch-primary">Détails du match →</span>
    </div>
  </button>
);

export const TeamDetailView: React.FC = () => {
  const { teamId = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [competitionFilter, setCompetitionFilter] = useState('all');
  const [rosterSort, setRosterSort] = useState<'goals' | 'assists' | 'appearances' | 'yellowCards' | 'redCards'>('goals');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    teamsService.getDetail(teamId, {
      competitionId: competitionFilter,
      sortBy: rosterSort,
    }).then((teamData) => {
      if (!active) return;
      setTeam(teamData);
    }).catch((error: unknown) => {
      if (active) showToast(error instanceof Error ? error.message : 'Impossible de charger la fiche de l’équipe.', 'error');
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [teamId, showToast, competitionFilter, rosterSort]);

  if (isLoading && (!team || team.id !== teamId)) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  if (!team) return <EmptyState icon={Trophy} title="Équipe introuvable" description="Cette équipe n’existe pas ou n’est plus disponible." actionLabel="Retour aux équipes" onAction={() => navigate('/teams')} />;

  return (
    <div className="page-enter min-w-0 space-y-6 overflow-x-clip pb-16">
      <button type="button" onClick={() => navigate('/teams')} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-bold text-pitch-primary hover:bg-pitch-light">
        <ArrowLeft className="h-4 w-4" /> Retour aux équipes
      </button>

      <section className="overflow-hidden rounded-3xl border border-pitch-line bg-white shadow-xs">
        <div className="relative h-44 bg-pitch-panel sm:h-56">
          <img src={team.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <img src={team.logoUrl} alt={`Logo ${team.name}`} className="-mt-14 h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-sm sm:-mt-12 sm:h-24 sm:w-24" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-pitch-primary">{team.division} · {team.category}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-pitch-ink sm:text-3xl">{team.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" />{team.city} · {team.clubName || team.name}</p>
          </div>
          <div className="rounded-2xl bg-pitch-panel px-4 py-3 text-sm">
            <p className="text-caption uppercase text-slate-500">Bilan de la saison</p>
            <p className="mt-1 font-extrabold text-pitch-ink">{team.stats.matchesPlayed} matchs · {team.stats.points} pts</p>
            <div className="mt-2 flex items-center gap-1">{team.recentForm.length ? team.recentForm.map((result, index) => <FormIndicator key={`${result}-${index}`} result={result} size="sm" />) : <span className="text-caption text-slate-400">Aucun résultat enregistré</span>}</div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]">
        <article className="min-w-0 rounded-2xl border border-pitch-line bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-pitch-primary" />
            <h2 className="text-lg font-extrabold text-pitch-ink">Entraîneur</h2>
          </div>
          <p className="mt-4 wrap-break-words text-base font-bold text-pitch-ink">{team.coachName?.trim() || 'Entraîneur non renseigné'}</p>
          <p className="mt-1 wrap-break-words text-sm text-slate-500">Staff de {team.name}</p>
        </article>

        <article className="min-w-0 rounded-2xl border border-pitch-line bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-pitch-primary" />
              <h2 className="text-lg font-extrabold text-pitch-ink">Effectif</h2>
            </div>
            <span className="text-sm text-slate-500">{team.members.length} joueur{team.members.length === 1 ? '' : 's'}</span>
          </div>
          {team.members.length ? (
            <>
              <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row">
                <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">
                  Compétition
                  <SelectField value={competitionFilter} onChange={(event) => setCompetitionFilter(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-pitch-line bg-white px-3 text-sm text-pitch-ink focus:border-pitch-primary">
                    <option value="all">Toutes les compétitions</option>
                    {team.competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.title}</option>)}
                  </SelectField>
                </label>
                <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">
                  Trier par
                  <SelectField value={rosterSort} onChange={(event) => setRosterSort(event.target.value as typeof rosterSort)} className="mt-1 min-h-11 w-full rounded-xl border border-pitch-line bg-white px-3 text-sm text-pitch-ink focus:border-pitch-primary">
                    <option value="goals">Buts</option>
                    <option value="assists">Passes décisives</option>
                    <option value="appearances">Matchs joués*</option>
                    <option value="yellowCards">Cartons jaunes</option>
                    <option value="redCards">Cartons rouges</option>
                  </SelectField>
                </label>
              </div>
              <div className="mt-4 w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-160 text-left text-xs">
                  <thead className="border-b border-pitch-line text-slate-500">
                    <tr><th className="py-3 pr-3">Joueur</th><th className="px-3 py-3 text-center">Matchs*</th><th className="px-3 py-3 text-center">Buts</th><th className="px-3 py-3 text-center">Passes D</th><th className="px-3 py-3 text-center">Jaunes</th><th className="px-3 py-3 text-center">Rouges</th><th className="px-3 py-3 text-center">Minutes</th></tr>
                  </thead>
                  <tbody className="divide-y divide-pitch-separator">
                    {team.members.map((member) => (
                      <tr key={member.playerId}>
                        <td className="py-3 pr-3"><div className="flex items-center gap-2"><img src={member.avatarUrl || team.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" /><div className="min-w-0"><EntityLink section="players" id={member.playerId} className="block max-w-48 truncate font-bold text-pitch-ink" title={member.name}>{member.name}</EntityLink><span className="text-slate-500">{member.position}</span></div></div></td>
                        <td className="px-3 py-3 text-center tabular-nums">{member.appearances ?? 0}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{member.goals ?? 0}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{member.assists ?? 0}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{member.yellowCards ?? 0}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{member.redCards ?? 0}</td>
                        <td className="px-3 py-3 text-center text-slate-400">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-caption text-slate-500">* Les matchs joués sont comptabilisés à partir des événements enregistrés. Les feuilles de match et les minutes individuelles ne sont pas encore disponibles.</p>
            </>
          ) : (
            <p className="mt-4 rounded-xl bg-pitch-panel p-4 text-sm text-slate-500">Aucun joueur n’est encore renseigné dans l’effectif.</p>
          )}
        </article>
      </section>

      <section className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-pitch-primary" /><h2 className="text-lg font-extrabold text-pitch-ink">Résultats récents</h2></div>
          {team.recentMatches.length ? team.recentMatches.map((match) => <MatchCard key={match.id} match={match} onOpen={(id) => navigate(`/matches/${encodeURIComponent(id)}`)} />) : <p className="rounded-2xl border border-pitch-line bg-white p-5 text-sm text-slate-500">Aucun résultat enregistré pour cette équipe.</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-pitch-primary" /><h2 className="text-lg font-extrabold text-pitch-ink">Matchs à venir</h2></div>
          {team.upcomingMatches.length ? team.upcomingMatches.map((match) => <MatchCard key={match.id} match={match} onOpen={(id) => navigate(`/matches/${encodeURIComponent(id)}`)} />) : <p className="rounded-2xl border border-pitch-line bg-white p-5 text-sm text-slate-500">Aucun match à venir programmé.</p>}
          {team.topScorers.length > 0 && (
            <div className="rounded-2xl border border-pitch-line bg-white p-4">
              <h3 className="text-sm font-extrabold text-pitch-ink">Meilleurs buteurs de l’équipe</h3>
              <ul className="mt-3 divide-y divide-pitch-separator">
                {team.topScorers.map((scorer) => <li key={scorer.playerId} className="flex items-center justify-between gap-3 py-2 text-sm"><EntityLink section="players" id={scorer.playerId}>{scorer.playerName}</EntityLink><span className="font-bold tabular-nums text-pitch-primary">{scorer.goals} buts</span></li>)}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TeamDetailView;
