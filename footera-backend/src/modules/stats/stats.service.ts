import { Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { PlayersService } from '../players/players.service.js';
import { PlayerMatchStatsService } from '../players/player-match-stats.service.js';
import { TeamsService } from '../teams/teams.service.js';
import { buildTournamentStandings } from '../tournaments/tournament-standings.js';
import type { MatchRecord, PlayerRecord, TeamRecord, TournamentRecord } from '../../types/records.js';
import { MATCH_EVENT_TYPES, MATCH_STATUSES } from '../../types/domain.js';

const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80';

interface ContributionAccumulator {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  tournamentId?: string;
  tournamentTitle?: string;
  position?: string;
  goals: number;
  assists: number;
  penalties: number;
  matchesPlayed: number;
  minutesPlayed: number | null;
}

@Injectable()
export class StatsService {
  constructor(
    private readonly playersService: PlayersService,
    private readonly teamsService: TeamsService,
    private readonly records: RecordRepository,
    private readonly playerMatchStats: PlayerMatchStatsService,
  ) {}

  async topScorers(filters: { tournamentId?: string; teamId?: string; limit?: number } = {}) {
    const rows = await this.aggregatePlayerContributions(filters.tournamentId);
    const ranked = rows.filter((row) => row.goals > 0
      && (!filters.teamId || filters.teamId === 'all' || row.teamId === filters.teamId))
      .sort((left, right) => right.goals - left.goals || right.matchesPlayed - left.matchesPlayed)
      .map((row, index) => ({
        ...row,
        rank: index + 1,
        ratio: row.matchesPlayed ? Number((row.goals / row.matchesPlayed).toFixed(2)) : 0,
        minutesPerGoal: row.minutesPlayed === null ? null : Math.round(row.minutesPlayed / row.goals),
      }));
    return filters.limit ? ranked.slice(0, filters.limit) : ranked;
  }

  async topAssisters(filters: { tournamentId?: string; teamId?: string; limit?: number } = {}) {
    const rows = await this.aggregatePlayerContributions(filters.tournamentId);
    const ranked = rows.filter((row) => row.assists > 0
      && (!filters.teamId || filters.teamId === 'all' || row.teamId === filters.teamId))
      .sort((left, right) => right.assists - left.assists || right.matchesPlayed - left.matchesPlayed)
      .map((row, index) => ({
        ...row,
        rank: index + 1,
        keyPasses: row.assists,
        ratio: row.matchesPlayed ? Number((row.assists / row.matchesPlayed).toFixed(2)) : 0,
      }));
    return filters.limit ? ranked.slice(0, filters.limit) : ranked;
  }

  private async aggregatePlayerContributions(tournamentId?: string) {
    const [players, teams, tournaments] = await Promise.all([
      this.playersService.list({ competitionId: tournamentId }), this.teamsService.list(),
      this.records.list<TournamentRecord>('tournaments'),
    ]);
    const totals = new Map<string, ContributionAccumulator>();
    const tournament = tournamentId ? tournaments.find((item) => item.id === tournamentId) : undefined;
    const statsByPlayer = await this.playerMatchStats.aggregate({ competitionId: tournamentId }, players);
    for (const [playerId, stats] of statsByPlayer) {
      for (const teamStats of stats.teamStats.values()) {
        if (tournament && !tournament.participantTeamIds?.includes(teamStats.teamId)) continue;
        if (!teamStats.goals && !teamStats.assists) continue;
        const player = players.find((item) => item.id === playerId);
        const team = teams.find((item) => item.id === teamStats.teamId);
        if (!player || !team) continue;
        const key = tournament ? `${player.id}:${team.id}:${tournament.id}` : `${player.id}:${team.id}`;
        const existing = totals.get(key);
        const current = existing ?? this.newContributionRow(player, team, tournament);
        current.goals += teamStats.goals;
        current.assists += teamStats.assists;
        current.penalties += teamStats.penalties;
        current.matchesPlayed += teamStats.appearances;
        current.minutesPlayed = !existing
          ? teamStats.minutesPlayed
          : current.minutesPlayed === null || teamStats.minutesPlayed === null
            ? null
            : current.minutesPlayed + teamStats.minutesPlayed;
        totals.set(key, current);
      }
    }
    return [...totals.values()];
  }

  private newContributionRow(player: PlayerRecord, team: TeamRecord, tournament?: TournamentRecord): ContributionAccumulator {
    return {
      playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl,
      teamId: team.id, teamName: team.name, teamLogo: team.logoUrl || FALLBACK_LOGO,
      ...(tournament ? { tournamentId: tournament.id, tournamentTitle: tournament.title } : {}),
      position: player.primaryPosition, goals: 0, assists: 0, penalties: 0,
      matchesPlayed: 0, minutesPlayed: null,
    };
  }

  async teamStats(filters: { tournamentId?: string } = {}) {
    const [teams, tournaments, matches, scorers, assisters] = await Promise.all([
      this.teamsService.list(), this.records.list<TournamentRecord>('tournaments'), this.records.list<MatchRecord>('matches'),
      this.topScorers({ tournamentId: filters.tournamentId }),
      this.topAssisters({ tournamentId: filters.tournamentId }),
    ]);
    const selected = filters.tournamentId
      ? tournaments.find((tournament) => tournament.id === filters.tournamentId)
      : undefined;
    return teams.map((team) => {
      const tournament = selected
        ? (selected.participantTeamIds ?? []).includes(team.id) ? selected : undefined
        : tournaments.find((item) => item.id === team.competitionId && item.participantTeamIds?.includes(team.id))
          ?? tournaments.find((item) => item.participantTeamIds?.includes(team.id));
      if (!tournament) return null;
      const standing = buildTournamentStandings(tournament, teams, matches).find((row) => row.teamId === team.id);
      const tournamentMatches = matches.filter((match) => match.tournamentId === tournament.id
        && match.status === MATCH_STATUSES.FINISHED
        && (match.homeTeam?.id === team.id || match.awayTeam?.id === team.id));
      const topScorer = scorers.filter((row) => row.teamId === team.id && row.tournamentId === tournament.id)
        .sort((a, b) => b.goals - a.goals)[0];
      const topAssister = assisters.filter((row) => row.teamId === team.id && row.tournamentId === tournament.id)
        .sort((a, b) => b.assists - a.assists)[0];
      const events = tournamentMatches.flatMap((match) => (match.events ?? []).filter((event) =>
        event.teamId === match.homeTeam?.id || event.teamId === match.awayTeam?.id));
      const played = standing?.played ?? 0;
      const goalsFor = standing?.goalsFor ?? 0;
      const goalsAgainst = standing?.goalsAgainst ?? 0;
      return {
        teamId: team.id, teamName: team.name, shortName: team.shortName, logoUrl: team.logoUrl,
        city: team.city, division: team.division, tournamentId: tournament.id, tournamentTitle: tournament.title,
        matchesPlayed: played, wins: standing?.won ?? 0, draws: standing?.drawn ?? 0, losses: standing?.lost ?? 0,
        winRate: played ? Math.round((standing!.won / played) * 100) : 0,
        goalsFor, goalsAgainst, goalDifference: goalsFor - goalsAgainst,
        goalsPerMatch: played ? Number((goalsFor / played).toFixed(2)) : 0,
        goalsAgainstPerMatch: played ? Number((goalsAgainst / played).toFixed(2)) : 0,
        cleanSheets: tournamentMatches.filter((match) => (match.homeTeam.id === team.id
          ? match.awayTeam.score : match.homeTeam.score) === 0).length,
        possessionAvg: null, passAccuracy: null, shotsPerMatch: null,
        yellowCards: events.filter((event) => event.teamId === team.id && event.type === MATCH_EVENT_TYPES.YELLOW_CARD).length,
        redCards: events.filter((event) => event.teamId === team.id && event.type === MATCH_EVENT_TYPES.RED_CARD).length,
        points: standing?.points ?? 0, recentForm: standing?.form ?? [],
        topScorer: topScorer ? { name: topScorer.playerName, playerId: topScorer.playerId, goals: topScorer.goals, avatarUrl: topScorer.avatarUrl }
          : { name: 'Aucun buteur', goals: 0 },
        topAssister: topAssister ? { name: topAssister.playerName, playerId: topAssister.playerId, assists: topAssister.assists, avatarUrl: topAssister.avatarUrl }
          : { name: 'Aucun passeur', assists: 0 },
      };
    }).filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((left, right) => right.points - left.points || right.goalDifference - left.goalDifference
      || right.goalsFor - left.goalsFor || left.teamName.localeCompare(right.teamName));
  }

  async playerStats(filters: { teamId?: string; tournamentId?: string; position?: string; searchQuery?: string } = {}) {
    const [players, teams] = await Promise.all([
      this.playersService.list({ competitionId: filters.tournamentId }),
      this.teamsService.list(),
    ]);
    let rows = players.map((player) => {
      const team = teams.find((item) => item.id === player.currentTeamId)
        || { id: player.currentTeamId || 'team_unknown', name: player.currentTeam || 'Club Libre', logoUrl: FALLBACK_LOGO };
      return {
        playerId: player.id, name: player.name, avatarUrl: player.avatarUrl, teamId: team.id,
        teamName: team.name, teamLogo: team.logoUrl, position: player.primaryPosition,
        strongFoot: player.strongFoot, age: player.age, appearances: player.appearances ?? 0,
        minutesPlayed: typeof player.minutesPlayed === 'number' ? player.minutesPlayed : null,
        goals: player.goals ?? 0, assists: player.assists ?? 0,
        yellowCards: player.yellowCards ?? 0,
        redCards: player.redCards ?? 0,
      };
    });
    if (filters.teamId && filters.teamId !== 'all') rows = rows.filter((item) => item.teamId === filters.teamId);
    if (filters.position && filters.position !== 'Tous') rows = rows.filter((item) => item.position === filters.position);
    if (filters.searchQuery?.trim()) {
      const query = filters.searchQuery.toLowerCase();
      rows = rows.filter((item) => `${item.name} ${item.teamName}`.toLowerCase().includes(query));
    }
    return rows.sort((left, right) => right.goals - left.goals || left.name.localeCompare(right.name));
  }
}
