import type { MatchEventRecord, MatchRecord, PlayerRecord, TournamentRecord } from '../../types/records.js';
import { MATCH_EVENT_TYPES, MATCH_STATUSES } from '../../types/domain.js';

export interface PlayerMatchStats {
  appearances: number;
  minutesPlayed: number | null;
  goals: number;
  penalties: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  teamStats: Map<string, PlayerTeamMatchStats>;
}

export interface PlayerTeamMatchStats {
  teamId: string;
  appearances: number;
  minutesPlayed: number | null;
  goals: number;
  penalties: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

function emptyStats(): Omit<PlayerMatchStats, 'teamStats'> {
  return { appearances: 0, minutesPlayed: 0, goals: 0, penalties: 0, assists: 0, yellowCards: 0, redCards: 0 };
}

function resolvePlayer(
  players: PlayerRecord[], event: MatchEventRecord, teamId: string,
  field: 'player' | 'assist', idField: 'playerId' | 'assistPlayerId',
) {
  const id = event[idField];
  if (typeof id === 'string') return players.find((player) => player.id === id);
  const name = event[field];
  if (typeof name !== 'string') return undefined;
  return players.find((player) => player.name === name && player.currentTeamId === teamId);
}

export function aggregatePlayerMatchStats(
  players: PlayerRecord[],
  matches: MatchRecord[],
  filters: { competitionId?: string; teamId?: string } = {},
  tournaments: TournamentRecord[] = [],
) {
  const totals = new Map<string, PlayerMatchStats>();
  const competitions = new Map(tournaments.map((tournament) => [tournament.id, new Set<string>(tournament.participantTeamIds ?? [])]));
  const finishedMatches = matches.filter((match) => match.status === MATCH_STATUSES.FINISHED
    && (!filters.competitionId || match.tournamentId === filters.competitionId)
    && (!filters.teamId || match.homeTeam?.id === filters.teamId || match.awayTeam?.id === filters.teamId)
    && (!match.tournamentId || !tournaments.length || (competitions.get(match.tournamentId)?.has(match.homeTeam?.id)
      && competitions.get(match.tournamentId)?.has(match.awayTeam?.id))));

  const ensureStats = (playerId: string): PlayerMatchStats => {
    const existing = totals.get(playerId);
    if (existing) return existing;
    const stats = { ...emptyStats(), teamStats: new Map<string, PlayerTeamMatchStats>() };
    totals.set(playerId, stats);
    return stats;
  };
  const ensureTeamStats = (playerId: string, teamId: string): PlayerTeamMatchStats => {
    const stats = ensureStats(playerId);
    const existing = stats.teamStats.get(teamId);
    if (existing) return existing;
    const teamStats = { teamId, ...emptyStats() };
    stats.teamStats.set(teamId, teamStats);
    return teamStats;
  };

  for (const match of finishedMatches) {
    const participantsByTeam = new Map<string, Set<string>>();
    const addParticipant = (teamId: string, playerId: string) => {
      const participants = participantsByTeam.get(teamId) ?? new Set<string>();
      participants.add(playerId);
      participantsByTeam.set(teamId, participants);
      ensureStats(playerId);
    };

    for (const event of Array.isArray(match.events) ? match.events : []) {
      if (typeof event.teamId !== 'string' || (filters.teamId && event.teamId !== filters.teamId)
        || (event.teamId !== match.homeTeam?.id && event.teamId !== match.awayTeam?.id)) continue;
      const scorer = resolvePlayer(players, event, event.teamId, 'player', 'playerId');
      if (scorer) {
        const stats = ensureStats(scorer.id);
        const teamStats = ensureTeamStats(scorer.id, event.teamId);
        if (event.type === MATCH_EVENT_TYPES.GOAL || event.type === MATCH_EVENT_TYPES.PENALTY) {
          stats.goals += 1;
          teamStats.goals += 1;
        }
        if (event.type === MATCH_EVENT_TYPES.PENALTY) {
          stats.penalties += 1;
          teamStats.penalties += 1;
        }
        if (event.type === MATCH_EVENT_TYPES.YELLOW_CARD) {
          stats.yellowCards += 1;
          teamStats.yellowCards += 1;
        }
        if (event.type === MATCH_EVENT_TYPES.RED_CARD) {
          stats.redCards += 1;
          teamStats.redCards += 1;
        }
        addParticipant(event.teamId, scorer.id);
      }
      if (event.type === MATCH_EVENT_TYPES.GOAL || event.type === MATCH_EVENT_TYPES.PENALTY) {
        const assister = resolvePlayer(players, event, event.teamId, 'assist', 'assistPlayerId');
        if (assister) {
          if (assister.id !== scorer?.id) {
            ensureStats(assister.id).assists += 1;
            ensureTeamStats(assister.id, event.teamId).assists += 1;
          }
          addParticipant(event.teamId, assister.id);
        }
      }
      if (event.type === MATCH_EVENT_TYPES.SUBSTITUTION && event.substitutedPlayerId) {
        const outgoing = players.find((player) => player.id === event.substitutedPlayerId);
        if (outgoing) addParticipant(event.teamId, outgoing.id);
      }
    }

    const lineupsByTeam = new Map((match.lineups ?? []).map((lineup) => [lineup.teamId, lineup.playerIds]));
    for (const lineup of match.lineups ?? []) {
      if ((filters.teamId && lineup.teamId !== filters.teamId)
        || (lineup.teamId !== match.homeTeam?.id && lineup.teamId !== match.awayTeam?.id)) continue;
      for (const playerId of lineup.playerIds) addParticipant(lineup.teamId, playerId);
    }

    for (const [teamId, participantIds] of participantsByTeam) {
      const knownLineup = lineupsByTeam.has(teamId) && Number.isInteger(match.minute) && (match.minute ?? 0) >= 0;
      const duration = knownLineup ? Math.min(match.minute ?? 0, 130) : undefined;
      const minutesByPlayer = new Map<string, number>();
      if (duration !== undefined) {
        const activeSince = new Map<string, number>((lineupsByTeam.get(teamId) ?? []).map((playerId) => [playerId, 0]));
        const playerExitEvents = (match.events ?? [])
          .filter((event) => event.teamId === teamId && (
            (event.type === MATCH_EVENT_TYPES.SUBSTITUTION && event.substitutedPlayerId)
            || event.type === MATCH_EVENT_TYPES.RED_CARD
          ))
          .sort((left, right) => left.minute - right.minute);
        for (const event of playerExitEvents) {
          const minute = Math.min(Math.max(event.minute, 0), duration);
          const outgoingId = event.type === MATCH_EVENT_TYPES.SUBSTITUTION ? event.substitutedPlayerId : event.playerId;
          if (!outgoingId) continue;
          const outgoingStarted = activeSince.get(outgoingId);
          if (outgoingStarted !== undefined) {
            minutesByPlayer.set(outgoingId, (minutesByPlayer.get(outgoingId) ?? 0) + Math.max(0, minute - outgoingStarted));
            activeSince.delete(outgoingId);
          }
          if (event.type === MATCH_EVENT_TYPES.SUBSTITUTION && event.playerId && !activeSince.has(event.playerId)) {
            activeSince.set(event.playerId, minute);
          }
        }
        for (const [playerId, startedAt] of activeSince) {
          minutesByPlayer.set(playerId, (minutesByPlayer.get(playerId) ?? 0) + Math.max(0, duration - startedAt));
        }
      }
      for (const playerId of participantIds) {
        const stats = ensureStats(playerId);
        const teamStats = ensureTeamStats(playerId, teamId);
        stats.appearances += 1;
        teamStats.appearances += 1;
        const playedMinutes = duration === undefined ? undefined : minutesByPlayer.get(playerId);
        if (playedMinutes === undefined) {
          stats.minutesPlayed = null;
          teamStats.minutesPlayed = null;
        } else if (stats.minutesPlayed !== null) {
          stats.minutesPlayed = (stats.minutesPlayed ?? 0) + playedMinutes;
        }
        if (playedMinutes === undefined) teamStats.minutesPlayed = null;
        else if (teamStats.minutesPlayed !== null) teamStats.minutesPlayed = (teamStats.minutesPlayed ?? 0) + playedMinutes;
        stats.teamStats.set(teamId, teamStats);
      }
    }
  }
  return totals;
}
