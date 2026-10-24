import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Goal, Handshake, ShieldAlert, ShieldCheck } from 'lucide-react';
import { statsService } from '../../../services/statsService';
import type { Player, PlayerStatsItem } from '../../../types';
import { EntityLink } from '../../common/EntityLink';
import { useTranslation } from '../../../i18n';

export const PlayerCareerPanel: React.FC<{ player: Player }> = ({ player }) => {
  const { t } = useTranslation();
  const [currentTeamStats, setCurrentTeamStats] = useState<PlayerStatsItem | null>(null);

  useEffect(() => {
    let isActive = true;
    statsService.getPlayersStats({ searchQuery: player.name })
      .then((rows) => {
        if (isActive) setCurrentTeamStats(rows.find((row) => row.playerId === player.id) ?? null);
      })
      .catch(() => {
        if (isActive) setCurrentTeamStats(null);
      });
    return () => { isActive = false; };
  }, [player.id, player.name]);

  const statCards = [
    { label: t('playerStats.matchesPlayed'), value: player.appearances, icon: CalendarDays },
    { label: t('playerStats.minutesPlayed'), value: player.minutesPlayed ?? t('stats.notRecorded'), icon: Clock3 },
    { label: t('stats.goals'), value: player.goals, icon: Goal },
    { label: t('playerStats.assists'), value: player.assists, icon: Handshake },
    { label: t('playerStats.yellowCards'), value: player.yellowCards, icon: ShieldAlert },
    { label: t('playerStats.redCards'), value: player.redCards ?? t('stats.notRecorded'), icon: ShieldCheck },
  ];

  const historicTeams = player.teamHistoryStats ?? [];
  const historicNames = new Set(historicTeams.map((team) => team.teamName));
  const pastClubsWithoutStats = player.previousClubs.filter((club) => !historicNames.has(club));

  return (
    <section className="space-y-5" aria-label={t('playerStats.careerAndStats')}>
      <div className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-pitch-ink">{t('playerStats.global')}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('playerStats.globalDescription')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-pitch-line bg-pitch-panel p-4">
              <Icon className="mb-3 h-4 w-4 text-pitch-primary" aria-hidden="true" />
              <strong className="block text-xl font-black text-pitch-ink">{value}</strong>
              <span className="mt-1 block text-caption font-semibold text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
        <h2 className="mb-4 text-lg font-extrabold text-pitch-ink">{t('playerStats.byTeam')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-pitch-line text-slate-500">
              <tr>
                <th className="py-3 pr-3">{t('stats.team')}</th>
                <th className="px-3 py-3 text-center">{t('stats.matches')}</th>
                <th className="px-3 py-3 text-center">{t('stats.minutes')}</th>
                <th className="px-3 py-3 text-center">{t('stats.goals')}</th>
                <th className="px-3 py-3 text-center">{t('playerStats.assists')}</th>
                <th className="px-3 py-3 text-center">{t('playerStats.yellowCards')}</th>
                <th className="px-3 py-3 text-center">{t('playerStats.redCards')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pitch-separator">
              {historicTeams.map((team) => (
                <tr key={`${team.teamId ?? team.teamName}`}>
                  <td className="py-3 pr-3 font-bold text-pitch-ink"><EntityLink section="teams" id={team.teamId}>{team.teamName}</EntityLink></td>
                  <td className="px-3 py-3 text-center">{team.appearances}</td>
                  <td className="px-3 py-3 text-center">{team.minutesPlayed ?? '—'}</td>
                  <td className="px-3 py-3 text-center">{team.goals}</td>
                  <td className="px-3 py-3 text-center">{team.assists}</td>
                  <td className="px-3 py-3 text-center">{team.yellowCards}</td>
                  <td className="px-3 py-3 text-center">{team.redCards ?? '—'}</td>
                </tr>
              ))}
              {currentTeamStats && !historicTeams.some((team) => team.teamId === currentTeamStats.teamId) && (
                <tr>
                  <td className="py-3 pr-3 font-bold text-pitch-ink"><EntityLink section="teams" id={currentTeamStats.teamId}>{currentTeamStats.teamName}</EntityLink></td>
                  <td className="px-3 py-3 text-center">{currentTeamStats.appearances}</td>
                  <td className="px-3 py-3 text-center">{currentTeamStats.minutesPlayed ?? '—'}</td>
                  <td className="px-3 py-3 text-center">{currentTeamStats.goals}</td>
                  <td className="px-3 py-3 text-center">{currentTeamStats.assists}</td>
                  <td className="px-3 py-3 text-center">{currentTeamStats.yellowCards}</td>
                  <td className="px-3 py-3 text-center">{player.redCards ?? '—'}</td>
                </tr>
              )}
              {!currentTeamStats && historicTeams.length === 0 && player.currentTeam && (
                <tr>
                  <td className="py-3 pr-3 font-bold text-pitch-ink">{player.currentTeam}</td>
                  <td className="px-3 py-3 text-center">{player.appearances}</td>
                  <td className="px-3 py-3 text-center">{player.minutesPlayed ?? '—'}</td>
                  <td className="px-3 py-3 text-center">{player.goals}</td>
                  <td className="px-3 py-3 text-center">{player.assists}</td>
                  <td className="px-3 py-3 text-center">{player.yellowCards}</td>
                  <td className="px-3 py-3 text-center">{player.redCards ?? '—'}</td>
                </tr>
              )}
              {!currentTeamStats && historicTeams.length === 0 && !player.currentTeam && (
                <tr><td colSpan={7} className="py-5 text-center text-slate-500">{t('playerStats.noTeamStats')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pastClubsWithoutStats.length > 0 && (
          <div className="mt-4 border-t border-pitch-separator pt-4">
            <h3 className="text-xs font-bold text-pitch-ink">{t('playerStats.previousClubs')}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t('playerStats.previousClubsWithoutStats', { clubs: pastClubsWithoutStats.join(' · ') })}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

