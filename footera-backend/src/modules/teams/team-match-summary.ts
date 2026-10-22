type MatchOutcome = 'V' | 'N' | 'D';

interface MatchRecord {
  id: string;
  status: string;
  playedAt?: string;
  scheduledAt?: string;
  date?: string;
  homeTeam: { id: string; score: number };
  awayTeam: { id: string; score: number };
  events?: Array<{ type: string; minute: number; teamId: string; player: string; assist?: string }>;
}

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
    goalScorers: (match.events ?? []).filter((event) => event.type === 'goal'),
  };
}

export function buildTeamMatchSummary(teamId: string, matches: MatchRecord[], formLimit = 5) {
  const teamMatches = matches.filter((match) => match.homeTeam.id === teamId || match.awayTeam.id === teamId);
  const recentMatches = teamMatches
    .filter((match) => match.status === 'FINISHED')
    .sort(byLatestDate)
    .map((match) => withGoalScorers(teamId, match));
  const upcomingMatches = teamMatches
    .filter((match) => match.status === 'SCHEDULED')
    .sort(byLatestDate)
    .map((match) => withGoalScorers(teamId, match));

  return {
    recentMatches,
    upcomingMatches,
    recentForm: recentMatches.slice(0, formLimit).map((match) => resultForTeam(teamId, match)),
  };
}
