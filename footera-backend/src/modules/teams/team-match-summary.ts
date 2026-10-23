type MatchOutcome = 'V' | 'N' | 'D';
import type { MatchRecord } from '../../types/records.js';
import { MATCH_EVENT_TYPES, MATCH_STATUSES } from '../../types/domain.js';

function byLatestDate(left: MatchRecord, right: MatchRecord): number {
  const leftDate = Date.parse(left.playedAt ?? left.scheduledAt ?? left.date ?? '');
  const rightDate = Date.parse(right.playedAt ?? right.scheduledAt ?? right.date ?? '');
  if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) return rightDate - leftDate;
  if (Number.isFinite(leftDate)) return -1;
  if (Number.isFinite(rightDate)) return 1;
  return 0;
}

function resultForTeam(teamId: string, match: MatchRecord): MatchOutcome {
  const teamScore = match.homeTeam.id === teamId ? match.homeTeam.score : match.awayTeam.score;
  const opponentScore = match.homeTeam.id === teamId ? match.awayTeam.score : match.homeTeam.score;
  return teamScore > opponentScore ? 'V' : teamScore < opponentScore ? 'D' : 'N';
}

function withGoalScorers(teamId: string, match: MatchRecord) {
  return {
    ...match,
    isHome: match.homeTeam.id === teamId,
    goalScorers: (match.events ?? []).filter((event) => event.type === MATCH_EVENT_TYPES.GOAL),
  };
}

export function buildTeamMatchSummary(teamId: string, matches: MatchRecord[], formLimit = 5) {
  const teamMatches = matches.filter((match) => match.homeTeam.id === teamId || match.awayTeam.id === teamId);
  const recentMatches = teamMatches
    .filter((match) => match.status === MATCH_STATUSES.FINISHED)
    .sort(byLatestDate)
    .map((match) => withGoalScorers(teamId, match));
  const upcomingMatches = teamMatches
    .filter((match) => match.status === MATCH_STATUSES.SCHEDULED)
    .sort(byLatestDate)
    .map((match) => withGoalScorers(teamId, match));

  return {
    recentMatches,
    upcomingMatches,
    recentForm: recentMatches.slice(0, formLimit).map((match) => resultForTeam(teamId, match)),
  };
}
