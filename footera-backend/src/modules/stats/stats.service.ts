import { Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { PlayersService } from '../players/players.service.js';
import { TeamsService } from '../teams/teams.service.js';
import { buildTournamentStandings } from '../tournaments/tournament-standings.js';

const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80';

@Injectable()
export class StatsService {
  constructor(
    private readonly playersService: PlayersService,
    private readonly teamsService: TeamsService,
    private readonly records: RecordRepository,
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
        minutesPerGoal: 0,
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
    const [players, teams, matches, tournaments]: any[][] = await Promise.all([
      this.playersService.list(), this.teamsService.list(), this.records.list('matches'),
      this.records.list('tournaments'),
    ]);
    const selectedTournaments = tournaments.filter((tournament) => !tournamentId || tournament.id === tournamentId);
    const totals = new Map<string, any>();
    for (const tournament of selectedTournaments) {
      const participantIds = new Set<string>(tournament.participantTeamIds ?? []);
      if (!participantIds.size) continue;
      const tournamentMatches = matches.filter((match) => match.tournamentId === tournament.id
        && match.status === 'FINISHED'
        && participantIds.has(match.homeTeam?.id)
        && participantIds.has(match.awayTeam?.id));
      for (const match of tournamentMatches) {
        for (const event of Array.isArray(match.events) ? match.events : []) {
          if (!['goal', 'penalty'].includes(event.type) || !participantIds.has(event.teamId)
            || (event.teamId !== match.homeTeam?.id && event.teamId !== match.awayTeam?.id)) continue;
          const team = teams.find((item) => item.id === event.teamId);
          const player = players.find((item) => item.id === event.playerId
            || (!event.playerId && item.name === event.player
              && (item.currentTeamId === event.teamId || item.currentTeam === team?.name)));
          if (player && team) {
            const key = `${player.id}:${team.id}`;
            const row = totals.get(key) ?? this.newContributionRow(player, team, tournament);
            row.goals += 1;
            row.matchIds.add(match.id);
            if (event.type === 'penalty') row.penalties += 1;
            totals.set(key, row);
          }
          const assister = players.find((item) => item.id === event.assistPlayerId
            || (!event.assistPlayerId && item.name === event.assist
              && (item.currentTeamId === event.teamId || item.currentTeam === team?.name)));
          if (assister && team && event.assist) {
            const key = `${assister.id}:${team.id}`;
            const row = totals.get(key) ?? this.newContributionRow(assister, team, tournament);
            row.assists += 1;
            row.matchIds.add(match.id);
            totals.set(key, row);
          }
        }
      }
    }
    return [...totals.values()].map(({ matchIds, ...row }) => ({ ...row, matchesPlayed: matchIds.size }));
  }

  private newContributionRow(player: any, team: any, tournament: any) {
    return {
      playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl,
      teamId: team.id, teamName: team.name, teamLogo: team.logoUrl || FALLBACK_LOGO,
      tournamentId: tournament.id, tournamentTitle: tournament.title,
      position: player.primaryPosition, goals: 0, assists: 0, penalties: 0,
      matchIds: new Set<string>(),
    };
  }

  async teamStats(filters: { tournamentId?: string } = {}) {
    const [teams, tournaments, matches, scorers, assisters]: [any[], any[], any[], any[], any[]] = await Promise.all([
      this.teamsService.list(), this.records.list('tournaments'), this.records.list('matches'),
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
        && match.status === 'FINISHED'
        && (match.homeTeam?.id === team.id || match.awayTeam?.id === team.id));
      const topScorer = scorers.filter((row) => row.teamId === team.id && row.tournamentId === tournament.id)
        .sort((a, b) => b.goals - a.goals)[0];
      const topAssister = assisters.filter((row) => row.teamId === team.id && row.tournamentId === tournament.id)
        .sort((a, b) => b.assists - a.assists)[0];
      const events = tournamentMatches.flatMap((match) => (match.events ?? []).filter((event: any) =>
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
        possessionAvg: 0, passAccuracy: 0, shotsPerMatch: 0,
        yellowCards: events.filter((event) => event.teamId === team.id && event.type === 'yellow_card').length,
        redCards: events.filter((event) => event.teamId === team.id && event.type === 'red_card').length,
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

  async playerStats(filters: { teamId?: string; position?: string; searchQuery?: string } = {}) {
    const [players, teams]: any[][] = await Promise.all([this.playersService.list(), this.teamsService.list()]);
    let rows = players.map((player) => {
      const team = teams.find((item) => item.id === player.currentTeamId)
        || { id: player.currentTeamId || 'team_unknown', name: player.currentTeam || 'Club Libre', logoUrl: FALLBACK_LOGO };
      return {
        playerId: player.id, name: player.name, avatarUrl: player.avatarUrl, teamId: team.id,
        teamName: team.name, teamLogo: team.logoUrl, position: player.primaryPosition,
        strongFoot: player.strongFoot, age: player.age, appearances: player.appearances ?? 0,
        minutesPlayed: 0, goals: player.goals ?? 0, assists: player.assists ?? 0,
        rating: 0, shotsOnTarget: 0, passAccuracy: 0, yellowCards: player.yellowCards ?? 0,
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
