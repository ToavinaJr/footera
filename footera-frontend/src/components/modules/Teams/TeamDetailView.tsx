import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, Trophy } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { matchesService } from '../../../services/matchesService';
import { statsService } from '../../../services/statsService';
import { teamsService } from '../../../services/teamsService';
import { Match, Team, TopScorerItem } from '../../../types';
import { Badge, FormIndicator } from '../../common/Badge';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { EntityLink } from '../../common/EntityLink';
import { useApp } from '../../../context/useApp';

const MatchCard: React.FC<{ match: Match; team: Team; onOpen: (id: string) => void }> = ({ match, team, onOpen }) => {
  const isHome = match.homeTeam.id === team.id;
  const goals = match.events.filter((event) => event.type === 'goal');
  const score = match.status === 'SCHEDULED'
    ? `${match.date} · ${match.time}`
    : `${match.homeTeam.score} - ${match.awayTeam.score}`;

  return (
    <button
      type="button"
      onClick={() => onOpen(match.id)}
      className="w-full cursor-pointer rounded-2xl border border-pitch-line bg-white p-4 text-left shadow-xs focus-visible:outline-2 focus-visible:outline-pitch-primary sm:p-5"
      aria-label={`Voir le match ${match.homeTeam.name} contre ${match.awayTeam.name}`}
    >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-pitch-ink">{match.competition}</span>
          <Badge variant={match.status === 'SCHEDULED' ? 'amber' : match.status === 'LIVE' ? 'emerald' : 'slate'} size="sm">
            {match.status === 'SCHEDULED' ? 'À venir' : match.status === 'LIVE' ? 'En direct' : 'Terminé'}
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-pitch-ink">
            <img src={match.homeTeam.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
            <span className="truncate">{match.homeTeam.name}</span>
          </span>
          <span className="text-center text-sm font-black tabular-nums text-pitch-primary">{score}</span>
          <span className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-bold text-pitch-ink">
            <span className="truncate">{match.awayTeam.name}</span>
            <img src={match.awayTeam.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
          </span>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{match.pitchName || match.venue}{match.city ? ` · ${match.city}` : ''}</span>
        </p>
      {match.status === 'SCHEDULED' ? (
        <div className="mt-3 border-t border-pitch-separator pt-3">
          <p className="text-xs text-slate-600">Buteurs du match : à renseigner après la rencontre.</p>
        </div>
      ) : goals.length > 0 ? (
        <div className="mt-3 border-t border-pitch-separator pt-3">
          <p className="text-caption font-bold uppercase tracking-wide text-slate-500">Buteurs</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {goals.map((goal, index) => (
              <li key={`${goal.minute}-${goal.teamId}-${index}`} className="text-xs text-slate-600">
                <span className="font-bold text-pitch-primary">{goal.minute}&apos;</span>{' '}
                {goal.teamId === team.id ? <strong className="text-pitch-ink">{goal.player}</strong> : goal.player}
                {goal.assist ? <span className="text-slate-500"> (passe : {goal.assist})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between border-t border-pitch-separator pt-3 text-xs">
        <span className="text-slate-500">{isHome ? 'À domicile' : 'À l’extérieur'} · {match.venue}</span>
        <span className="font-bold text-pitch-primary">Détails du match →</span>
      </div>
    </button>
  );
};

export const TeamDetailView: React.FC = () => {
  const { teamId = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scorers, setScorers] = useState<TopScorerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([
      teamsService.getById(teamId),
      matchesService.list(),
      statsService.getTopScorers({ teamId }),
    ]).then(([teamData, matchData, scorerData]) => {
      if (!active) return;
      setTeam(teamData);
      setMatches(matchData.filter((match) => match.homeTeam.id === teamId || match.awayTeam.id === teamId));
      setScorers(scorerData);
    }).catch((error: unknown) => {
      if (active) showToast(error instanceof Error ? error.message : 'Impossible de charger la fiche de l’équipe.', 'error');
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [teamId, showToast]);

  const history = useMemo(() => matches.filter((match) => match.status === 'FINISHED' || match.status === 'LIVE'), [matches]);
  const upcoming = useMemo(() => matches.filter((match) => match.status === 'SCHEDULED'), [matches]);

  if (isLoading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  if (!team) return <EmptyState icon={Trophy} title="Équipe introuvable" description="Cette équipe n’existe pas ou n’est plus disponible." actionLabel="Retour aux équipes" onAction={() => navigate('/teams')} />;

  return (
    <div className="space-y-6 pb-16">
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
            <div className="mt-2 flex gap-1">{team.recentForm.map((result, index) => <FormIndicator key={`${result}-${index}`} result={result} size="sm" />)}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-pitch-primary" /><h2 className="text-lg font-extrabold text-pitch-ink">Résultats récents</h2></div>
          {history.length ? history.map((match) => <MatchCard key={match.id} match={match} team={team} onOpen={(id) => navigate(`/matches/${encodeURIComponent(id)}`)} />) : <p className="rounded-2xl border border-pitch-line bg-white p-5 text-sm text-slate-500">Aucun résultat enregistré pour cette équipe.</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-pitch-primary" /><h2 className="text-lg font-extrabold text-pitch-ink">Matchs à venir</h2></div>
          {upcoming.length ? upcoming.map((match) => <MatchCard key={match.id} match={match} team={team} onOpen={(id) => navigate(`/matches/${encodeURIComponent(id)}`)} />) : <p className="rounded-2xl border border-pitch-line bg-white p-5 text-sm text-slate-500">Aucun match à venir programmé.</p>}
          {scorers.length > 0 && (
            <div className="rounded-2xl border border-pitch-line bg-white p-4">
              <h3 className="text-sm font-extrabold text-pitch-ink">Meilleurs buteurs de l’équipe</h3>
              <ul className="mt-3 divide-y divide-pitch-separator">
                {scorers.slice(0, 3).map((scorer) => <li key={scorer.playerId} className="flex items-center justify-between gap-3 py-2 text-sm"><EntityLink section="players" id={scorer.playerId}>{scorer.playerName}</EntityLink><span className="font-bold tabular-nums text-pitch-primary">{scorer.goals} buts</span></li>)}
              </ul>
              <p className="mt-2 text-caption text-slate-500">Les buteurs d’un match à venir ne sont connus qu’après la rencontre.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TeamDetailView;
