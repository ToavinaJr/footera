import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Goal, Handshake, ShieldAlert, ShieldCheck } from 'lucide-react';
import { statsService } from '../../../services/statsService';
import type { Player, PlayerStatsItem } from '../../../types';
import { EntityLink } from '../../common/EntityLink';

export const PlayerCareerPanel: React.FC<{ player: Player }> = ({ player }) => {
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
    { label: 'Matchs joués', value: player.appearances, icon: CalendarDays },
    { label: 'Minutes jouées', value: player.minutesPlayed ?? 'Non renseigné', icon: Clock3 },
    { label: 'Buts', value: player.goals, icon: Goal },
    { label: 'Passes décisives', value: player.assists, icon: Handshake },
    { label: 'Cartons jaunes', value: player.yellowCards, icon: ShieldAlert },
    { label: 'Cartons rouges', value: player.redCards ?? 'Non renseigné', icon: ShieldCheck },
  ];

  const historicTeams = player.teamHistoryStats ?? [];
  const historicNames = new Set(historicTeams.map((team) => team.teamName));
  const pastClubsWithoutStats = player.previousClubs.filter((club) => !historicNames.has(club));

  return (
    <section className="space-y-5" aria-label="Parcours et statistiques du joueur">
      <div className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-pitch-ink">Statistiques globales</h2>
          <p className="mt-1 text-xs text-slate-500">Totaux de carrière renseignés dans le profil sportif.</p>
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
        <h2 className="mb-4 text-lg font-extrabold text-pitch-ink">Statistiques par équipe</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-pitch-line text-slate-500">
              <tr>
                <th className="py-3 pr-3">Équipe</th>
                <th className="px-3 py-3 text-center">Matchs</th>
                <th className="px-3 py-3 text-center">Minutes</th>
                <th className="px-3 py-3 text-center">Buts</th>
                <th className="px-3 py-3 text-center">Passes</th>
                <th className="px-3 py-3 text-center">Cartons jaunes</th>
                <th className="px-3 py-3 text-center">Cartons rouges</th>
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
                <tr><td colSpan={7} className="py-5 text-center text-slate-500">Aucune statistique par équipe n&apos;est renseignée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pastClubsWithoutStats.length > 0 && (
          <div className="mt-4 border-t border-pitch-separator pt-4">
            <h3 className="text-xs font-bold text-pitch-ink">Anciens clubs</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {pastClubsWithoutStats.join(' · ')} — historique connu, statistiques détaillées par club non renseignées.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

