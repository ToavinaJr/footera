import type { Match } from '../types';

/** Returns the latest completed match outcomes, newest first, for a team. */
export function getTeamRecentForm(teamId: string, matches: Match[], limit = 5): Array<'V' | 'N' | 'D'> {
  return matches
    .filter((match) => match.status === 'FINISHED'
      && (match.homeTeam.id === teamId || match.awayTeam.id === teamId))
    .map((match, index) => ({ match, index }))
    .sort((left, right) => {
      const leftTime = left.match.playedAt ? Date.parse(left.match.playedAt) : Number.NaN;
      const rightTime = right.match.playedAt ? Date.parse(right.match.playedAt) : Number.NaN;
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return rightTime - leftTime;
      if (Number.isFinite(leftTime)) return -1;
      if (Number.isFinite(rightTime)) return 1;
      return right.index - left.index;
    })
    .slice(0, limit)
    .map(({ match }) => {
      const teamScore = match.homeTeam.id === teamId ? match.homeTeam.score : match.awayTeam.score;
      const opponentScore = match.homeTeam.id === teamId ? match.awayTeam.score : match.homeTeam.score;
      return teamScore > opponentScore ? 'V' : teamScore < opponentScore ? 'D' : 'N';
    });
}
