export interface PlayerMatchStats {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

import type { MatchEventRecord, MatchRecord, PlayerRecord, TournamentRecord } from '../../types/records.js';
import { MATCH_EVENT_TYPES, MATCH_STATUSES } from '../../types/domain.js';

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

  const resolvePlayer = (event: MatchEventRecord, teamId: string, field: 'player' | 'assist', idField: 'playerId' | 'assistPlayerId') => {
    const id = event[idField];
    if (typeof id === 'string') return players.find((player) => player.id === id);
    const name = event[field];
    if (typeof name !== 'string') return undefined;
    return players.find((player) => player.name === name
      && player.currentTeamId === teamId);
  };

  for (const match of finishedMatches) {
    const participants = new Set<string>();
    for (const event of Array.isArray(match.events) ? match.events : []) {
      if (typeof event.teamId !== 'string'
        || (filters.teamId && event.teamId !== filters.teamId)
        || (event.teamId !== match.homeTeam?.id && event.teamId !== match.awayTeam?.id)) continue;
      const scorer = resolvePlayer(event, event.teamId, 'player', 'playerId');
      if (scorer) {
        const stats = totals.get(scorer.id) ?? { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
        if (event.type === MATCH_EVENT_TYPES.GOAL || event.type === MATCH_EVENT_TYPES.PENALTY) stats.goals += 1;
        if (event.type === MATCH_EVENT_TYPES.YELLOW_CARD) stats.yellowCards += 1;
        if (event.type === MATCH_EVENT_TYPES.RED_CARD) stats.redCards += 1;
        totals.set(scorer.id, stats);
        participants.add(scorer.id);
      }
      if (event.type === MATCH_EVENT_TYPES.GOAL || event.type === MATCH_EVENT_TYPES.PENALTY) {
        const assister = resolvePlayer(event, event.teamId, 'assist', 'assistPlayerId');
        if (assister) {
          const stats = totals.get(assister.id) ?? { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
          if (assister.id !== scorer?.id) stats.assists += 1;
          totals.set(assister.id, stats);
          participants.add(assister.id);
        }
      }
    }
    for (const lineup of match.lineups ?? []) {
      if (filters.teamId && lineup.teamId !== filters.teamId) continue;
      if (lineup.teamId !== match.homeTeam?.id && lineup.teamId !== match.awayTeam?.id) continue;
      for (const playerId of lineup.playerIds) {
        const player = players.find((candidate) => candidate.id === playerId && candidate.currentTeamId === lineup.teamId);
        if (player) participants.add(player.id);
      }
    }
    for (const playerId of participants) {
      const stats = totals.get(playerId)!;
      stats.appearances += 1;
    }
  }
  return totals;
}
