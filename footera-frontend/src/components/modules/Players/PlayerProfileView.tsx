import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { playersService } from '../../../services/playersService';
import { teamsService } from '../../../services/teamsService';
import type { Player, Team } from '../../../types';
import { PlayerCareerPanel } from './PlayerCareerPanel';
import { useApp } from '../../../context/useApp';
import { useTranslation } from '../../../i18n';

export const PlayerProfileView: React.FC = () => {
  const { playerId, profileId } = useParams();
  const id = profileId ?? playerId ?? '';
  const navigate = useNavigate();
  const { navigateToResource } = useApp();
  const { t } = useTranslation();
  const [player, setPlayer] = useState<Player | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setLoadError(false);
    setPlayer(null);
    Promise.all([
      playersService.getById(id),
      teamsService.list().catch(() => []),
    ])
      .then(([result, teamList]) => {
        if (!isActive) return;
        setPlayer(result);
        setTeams(teamList);
      })
      .catch(() => { if (isActive) setLoadError(true); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [id]);

  if (isLoading) return <div className="rounded-3xl border border-pitch-line bg-white p-8 text-sm text-slate-500">{t('profile.loading')}</div>;
  if (loadError || !player) return <div className="rounded-3xl border border-pitch-line bg-white p-8 text-sm text-slate-600">{t('profile.notFound')}</div>;

  return (
    <main className="page-enter space-y-6 pb-16">
      <header className="flex flex-col gap-5 rounded-3xl border border-pitch-line bg-white p-6 shadow-xs sm:flex-row sm:items-center md:p-8">
        <img src={player.avatarUrl} alt={player.name} className="h-24 w-24 rounded-2xl border-2 border-pitch-primary object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-pitch-primary">{t('players.profile')}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-pitch-ink md:text-3xl">{player.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{player.primaryPosition} · {player.age ? t('profile.ageYears', { age: player.age }) : t('stats.ageUnknown')} · {player.city}</p>
          <p className="mt-2 text-xs text-slate-600">{player.currentTeam ? t('players.currentTeam', { team: player.currentTeam }) : t('profile.noCurrentTeam')} · {player.level}</p>
        </div>
        {player.isAvailableForTransfer && <span className="rounded-full bg-[#ecfdf5] px-3 py-2 text-xs font-bold text-[#059669]">{t('players.available')}</span>}
      </header>

      {player.bio && <section className="rounded-3xl border border-pitch-line bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-xs md:p-6"><h2 className="mb-2 font-extrabold text-pitch-ink">{t('players.about')}</h2>{player.bio}</section>}
      <PlayerCareerPanel player={player} />
      <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
        <h2 className="text-lg font-extrabold text-pitch-ink">{t('profile.clubCareer')}</h2>
        {player.previousClubs.length ? (
          <ol className="mt-4 space-y-3 border-l-2 border-pitch-line pl-4">
            {player.previousClubs.map((club) => {
              const matchingTeam = teams.find((team) => team.name.toLowerCase() === club.toLowerCase())
                ?? teams.find((team) => team.clubName?.toLowerCase() === club.toLowerCase());
              return (
                <li key={club} className="text-sm font-semibold text-slate-700">
                  <button
                    type="button"
                    onClick={() => matchingTeam
                      ? navigateToResource('teams', matchingTeam.id)
                      : navigate(`/teams?query=${encodeURIComponent(club)}`)}
                    className="cursor-pointer text-left hover:text-pitch-primary hover:underline"
                  >
                    {club}
                  </button>
                </li>
              );
            })}
            {player.currentTeam && (
              <li className="text-sm font-bold text-pitch-primary">
                <button
                  type="button"
                  onClick={() => player.currentTeamId
                    ? navigateToResource('teams', player.currentTeamId)
                    : navigate(`/teams?query=${encodeURIComponent(player.currentTeam ?? '')}`)}
                  className="cursor-pointer hover:underline"
                >{player.currentTeam}</button> <span className="text-xs font-medium text-slate-500">({t('players.current')})</span>
              </li>
            )}
          </ol>
        ) : <p className="mt-3 text-sm text-slate-500">{t('profile.noPreviousClubs')}</p>}
      </section>
      <p className="text-center text-xs text-slate-400">{t('profile.publicPrivacyNotice')}</p>
    </main>
  );
};
