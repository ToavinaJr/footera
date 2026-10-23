import { describe, expect, it } from 'vitest';
import {
  SEED_CLUBS,
  SEED_CLUBS_EXTRA,
  SEED_BOOKINGS,
  SEED_ACTIVITY_FEED,
  SEED_MATCHES,
  SEED_PITCHES,
  SEED_PLAYERS,
  SEED_PLAYERS_EXTRA,
  SEED_TEAMS,
  SEED_TOURNAMENTS,
  SEED_USER,
} from './seeds.js';
import { validateSeedRelations } from './seed-data.js';
import { aggregatePlayerMatchStats } from '../modules/players/player-match-stats.js';
import type { MatchRecord, PlayerRecord, TournamentRecord } from './domain-records.js';

function idOf(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('id' in value)) return undefined;
  return typeof value.id === 'string' ? value.id : undefined;
}

describe('seed reference integrity', () => {
  const players = [...SEED_PLAYERS, ...SEED_PLAYERS_EXTRA];
  const playerIds = new Set(players.map((player) => player.id));
  const playersById = new Map(players.map((player) => [player.id, player]));
  const teamIds = new Set(SEED_TEAMS.map((team) => team.id));
  const clubIds = new Set([...SEED_CLUBS, ...SEED_CLUBS_EXTRA].map((club) => club.id));
  const pitchIds = new Set(SEED_PITCHES.map((pitch) => pitch.id));
  const tournamentIds = new Set(SEED_TOURNAMENTS.map((tournament) => tournament.id));

  it('links every player, roster member, and club team to a seeded record', () => {
    for (const player of players) {
      if (player.currentTeamId) expect(teamIds.has(player.currentTeamId), player.id).toBe(true);
    }
    for (const team of SEED_TEAMS) {
      if (team.clubId) expect(clubIds.has(team.clubId), team.id).toBe(true);
      expect(team.membersCount, `${team.id} member count`).toBe(team.members.length);
      for (const member of team.members) expect(playerIds.has(member.playerId), `${team.id}/${member.playerId}`).toBe(true);
    }
    for (const club of [...SEED_CLUBS, ...SEED_CLUBS_EXTRA]) {
      expect(club.teamsCount, `${club.id} team count`).toBe(club.teams.length);
      for (const team of club.teams) expect(teamIds.has(team.id), `${club.id}/${team.id}`).toBe(true);
    }
  });

  it('links match teams, competitions, venues, and event players to seeded records', () => {
    for (const rawMatch of SEED_MATCHES) {
      const match = rawMatch as unknown as Record<string, unknown>;
      const homeTeam = match.homeTeam as Record<string, unknown>;
      const awayTeam = match.awayTeam as Record<string, unknown>;
      expect(teamIds.has(String(homeTeam.id)), `${String(match.id)} home team`).toBe(true);
      expect(teamIds.has(String(awayTeam.id)), `${String(match.id)} away team`).toBe(true);
      if (typeof match.tournamentId === 'string') expect(tournamentIds.has(match.tournamentId), String(match.id)).toBe(true);
      if (typeof match.pitchId === 'string') expect(pitchIds.has(match.pitchId), String(match.id)).toBe(true);
      const events = Array.isArray(match.events) ? match.events : [];
      for (const rawEvent of events) {
        const event = rawEvent as Record<string, unknown>;
        if (typeof event.playerId === 'string') {
          expect(playerIds.has(event.playerId), `${String(match.id)}/${event.playerId}`).toBe(true);
          expect(playersById.get(event.playerId)?.currentTeamId, `${String(match.id)}/${event.playerId} team`).toBe(event.teamId);
        }
        if (typeof event.assistPlayerId === 'string') expect(playerIds.has(event.assistPlayerId), `${String(match.id)}/${event.assistPlayerId}`).toBe(true);
      }
    }
    for (const tournament of SEED_TOURNAMENTS) {
      for (const teamId of tournament.participantTeamIds ?? []) expect(teamIds.has(teamId), `${tournament.id}/${teamId}`).toBe(true);
    }
  });

  it('does not contain unresolved IDs in member or match references', () => {
    const unresolved = SEED_TEAMS.flatMap((team) => team.members
      .filter((member) => !playerIds.has(member.playerId))
      .map((member) => `${team.id}:${member.playerId}`));
    expect(unresolved).toEqual([]);
    expect(idOf(SEED_TEAMS.find((team) => team.id === 'team_04'))).toBe('team_04');
  });

  it('validates the complete database seed graph before it can be written', () => {
    expect(() => validateSeedRelations()).not.toThrow();
    expect(SEED_BOOKINGS.every((booking) => booking.userId === SEED_USER.id && pitchIds.has(booking.pitchId))).toBe(true);
    expect(SEED_ACTIVITY_FEED.every((activity) => typeof activity.targetId === 'string')).toBe(true);
  });

  it('keeps finished match scores and player event references consistent', () => {
    for (const rawMatch of SEED_MATCHES.filter((match) => match.status === 'FINISHED' || match.status === 'LIVE')) {
      const match = rawMatch as unknown as Record<string, unknown>;
      const home = match.homeTeam as { id: string; score: number };
      const away = match.awayTeam as { id: string; score: number };
      const events = Array.isArray(match.events) ? match.events as Array<Record<string, unknown>> : [];
      expect(events.filter((event) => event.teamId === home.id && ['goal', 'penalty'].includes(String(event.type)))).toHaveLength(home.score);
      expect(events.filter((event) => event.teamId === away.id && ['goal', 'penalty'].includes(String(event.type)))).toHaveLength(away.score);
      for (const event of events.filter((entry) => entry.type === 'yellow_card' || entry.type === 'red_card')) {
        expect(playerIds.has(String(event.playerId))).toBe(true);
      }
    }
  });

  it('derives appearances, goals, assists, and cards from finished match records', () => {
    const stats = aggregatePlayerMatchStats(
      players as PlayerRecord[],
      SEED_MATCHES as unknown as MatchRecord[],
      undefined,
      SEED_TOURNAMENTS as TournamentRecord[],
    );

    expect(stats.get('ply_mika')).toEqual({ appearances: 1, goals: 2, assists: 0, yellowCards: 0, redCards: 0 });
    expect(stats.get('ply_tahina')).toEqual({ appearances: 1, goals: 1, assists: 1, yellowCards: 0, redCards: 0 });
    expect(stats.get('ply_malik')).toEqual({ appearances: 1, goals: 1, assists: 0, yellowCards: 0, redCards: 0 });
    expect(stats.get('ply_05')).toEqual({ appearances: 1, goals: 0, assists: 0, yellowCards: 1, redCards: 0 });
  });
});
