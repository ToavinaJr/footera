import type { TeamRecord, TournamentRecord } from '../../types/records.js';
import { MATCH_STATUSES } from '../../types/domain.js';

export interface StandingMatch {
  id: string;
  tournamentId?: string;
  status: string;
  homeTeam?: { id: string; score: number };
  awayTeam?: { id: string; score: number };
}

interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  logoUrl?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Array<'V' | 'N' | 'D'>;
}

export function buildTournamentStandings(tournament: TournamentRecord, teams: TeamRecord[], matches: StandingMatch[]) {
  const participantIds = new Set<string>(tournament?.participantTeamIds ?? []);
  const rows = new Map<string, StandingRow>();
  for (const team of teams) {
    if (!participantIds.has(team.id)) continue;
    rows.set(team.id, {
      position: 0, teamId: team.id, teamName: team.name, logoUrl: team.logoUrl,
      played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0,
      goalDifference: 0, points: 0, form: [],
    });
  }

  const completedMatches = matches.filter((match) => match.tournamentId === tournament?.id
    && match.status === MATCH_STATUSES.FINISHED
    && Boolean(match.homeTeam?.id && match.awayTeam?.id)
    && participantIds.has(match.homeTeam!.id)
    && participantIds.has(match.awayTeam!.id)
    && Number.isInteger(match.homeTeam!.score) && match.homeTeam!.score >= 0
    && Number.isInteger(match.awayTeam!.score) && match.awayTeam!.score >= 0);

  for (const match of completedMatches) {
    const home = rows.get(match.homeTeam!.id);
    const away = rows.get(match.awayTeam!.id);
    if (!home || !away) continue;
    const homeScore = match.homeTeam!.score;
    const awayScore = match.awayTeam!.score;
    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;
    if (homeScore > awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
      home.form.push('V');
      away.form.push('D');
    } else if (homeScore < awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
      home.form.push('D');
      away.form.push('V');
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.form.push('N');
      away.form.push('N');
    }
  }

  return [...rows.values()]
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst, form: row.form.slice(-5) }))
    .sort((left, right) => right.points - left.points
      || right.goalDifference - left.goalDifference
      || right.goalsFor - left.goalsFor
      || left.teamName.localeCompare(right.teamName))
    .map((row, index) => ({ ...row, position: index + 1 }));
}
