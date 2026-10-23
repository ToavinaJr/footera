export interface PlayerMatchStats {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

import type { MatchEventRecord, MatchRecord, PlayerRecord, TournamentRecord } from '../../database/domain-records.js';

export function aggregatePlayerMatchStats(players: PlayerRecord[], matches: MatchRecord[], tournamentId?: string, tournaments: TournamentRecord[] = []) {
  const totals = new Map<string, PlayerMatchStats>();
  const competitions = new Map(tournaments.map((tournament) => [tournament.id, new Set<string>(tournament.participantTeamIds ?? [])]));
  const finishedMatches = matches.filter((match) => match.status === 'FINISHED'
    && typeof match.tournamentId === 'string'
    && (!tournamentId || match.tournamentId === tournamentId)
    && (!tournaments.length || (competitions.get(match.tournamentId)?.has(match.homeTeam?.id)
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
        || (event.teamId !== match.homeTeam?.id && event.teamId !== match.awayTeam?.id)) continue;
      const scorer = resolvePlayer(event, event.teamId, 'player', 'playerId');
      if (scorer) {
        const stats = totals.get(scorer.id) ?? { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
        if (event.type === 'goal' || event.type === 'penalty') stats.goals += 1;
        if (event.type === 'yellow_card') stats.yellowCards += 1;
        if (event.type === 'red_card') stats.redCards += 1;
        totals.set(scorer.id, stats);
        participants.add(scorer.id);
      }
      if (event.type === 'goal' || event.type === 'penalty') {
        const assister = resolvePlayer(event, event.teamId, 'assist', 'assistPlayerId');
        if (assister) {
          const stats = totals.get(assister.id) ?? { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
          if (assister.id !== scorer?.id) stats.assists += 1;
          totals.set(assister.id, stats);
          participants.add(assister.id);
        }
      }
    }
    for (const playerId of participants) {
      const stats = totals.get(playerId)!;
      stats.appearances += 1;
    }
  }
  return totals;
}
