import { Injectable } from '@nestjs/common';
import { PlayersService } from '../players/players.service.js';
import { TeamsService } from '../teams/teams.service.js';
import { TournamentsService } from '../tournaments/tournaments.service.js';

const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80';

@Injectable()
export class StatsService {
  constructor(private readonly playersService: PlayersService, private readonly teamsService: TeamsService, private readonly tournamentsService: TournamentsService) {}

  async topScorers(filters: { tournamentId?: string; teamId?: string; limit?: number } = {}) {
    const [players, teams, tournaments]: any[] = await Promise.all([this.playersService.list(), this.teamsService.list(), this.tournamentsService.list()]);
    const tournament = tournaments.find((item: any) => item.id === filters.tournamentId);
    let rows = players.map((player: any) => {
      const team = teams.find((item: any) => item.id === player.currentTeamId) || { id: player.currentTeamId || 'team_unknown', name: player.currentTeam || 'Club Libre', logoUrl: FALLBACK_LOGO };
      const standing = tournament?.standings?.find((item: any) => item.teamId === team.id);
      const matchesPlayed = tournament ? Math.max(1, standing?.played || 3) : player.appearances;
      const goals = tournament ? Math.max(1, Math.round(player.goals / (player.appearances || 1) * matchesPlayed)) : player.goals;
      return { playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl, teamId: team.id, teamName: team.name, teamLogo: team.logoUrl, tournamentId: tournament?.id, tournamentTitle: tournament?.title, position: player.primaryPosition, matchesPlayed, goals, penalties: Math.max(0, Math.floor(goals * .2)), ratio: matchesPlayed ? Number((goals / matchesPlayed).toFixed(2)) : 0, minutesPerGoal: goals ? Math.round(matchesPlayed * 85 / goals) : 0 };
    });
    if (filters.teamId && filters.teamId !== 'all') rows = rows.filter((row: any) => row.teamId === filters.teamId);
    const ranked = rows.sort((a: any, b: any) => b.goals - a.goals || b.ratio - a.ratio).map((row: any, index: number) => ({ ...row, rank: index + 1 }));
    return filters.limit ? ranked.slice(0, filters.limit) : ranked;
  }

  async topAssisters(filters: { tournamentId?: string; teamId?: string; limit?: number } = {}) {
    const [players, teams, tournaments]: any[] = await Promise.all([this.playersService.list(), this.teamsService.list(), this.tournamentsService.list()]);
    const tournament = tournaments.find((item: any) => item.id === filters.tournamentId);
    let rows = players.map((player: any) => {
      const team = teams.find((item: any) => item.id === player.currentTeamId) || { id: player.currentTeamId || 'team_unknown', name: player.currentTeam || 'Club Libre', logoUrl: FALLBACK_LOGO };
      const standing = tournament?.standings?.find((item: any) => item.teamId === team.id);
      const matchesPlayed = tournament ? Math.max(1, standing?.played || 3) : player.appearances;
      const assists = tournament ? Math.max(1, Math.round(player.assists / (player.appearances || 1) * matchesPlayed)) : player.assists;
      return { playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl, teamId: team.id, teamName: team.name, teamLogo: team.logoUrl, tournamentId: tournament?.id, tournamentTitle: tournament?.title, position: player.primaryPosition, matchesPlayed, assists, keyPasses: Math.round(assists * 2.8 + matchesPlayed), ratio: matchesPlayed ? Number((assists / matchesPlayed).toFixed(2)) : 0 };
    });
    if (filters.teamId && filters.teamId !== 'all') rows = rows.filter((row: any) => row.teamId === filters.teamId);
    const ranked = rows.sort((a: any, b: any) => b.assists - a.assists || b.ratio - a.ratio).map((row: any, index: number) => ({ ...row, rank: index + 1 }));
    return filters.limit ? ranked.slice(0, filters.limit) : ranked;
  }

  async teamStats(filters: { tournamentId?: string } = {}) {
    const [teams, players, tournaments]: any[] = await Promise.all([this.teamsService.list(), this.playersService.list(), this.tournamentsService.list()]);
    const tournament = tournaments.find((item: any) => item.id === filters.tournamentId);
    return teams.map((team: any, index: number) => {
      const roster = players.filter((player: any) => player.currentTeamId === team.id || player.currentTeam === team.name);
      const scorer = [...roster].sort((a: any, b: any) => b.goals - a.goals)[0];
      const assister = [...roster].sort((a: any, b: any) => b.assists - a.assists)[0];
      const standing = tournament?.standings?.find((row: any) => row.teamId === team.id);
      const stats = team.stats || {};
      const played = standing?.played ?? stats.matchesPlayed ?? 0;
      const wins = standing?.won ?? stats.wins ?? 0;
      const draws = standing?.drawn ?? stats.draws ?? 0;
      const losses = standing?.lost ?? stats.losses ?? 0;
      const goalsFor = standing?.goalsFor ?? stats.goalsFor ?? 0;
      const goalsAgainst = standing?.goalsAgainst ?? stats.goalsAgainst ?? 0;
      return {
        teamId: team.id, teamName: team.name, shortName: team.shortName, logoUrl: team.logoUrl, city: team.city, division: team.division,
        tournamentId: tournament?.id, tournamentTitle: tournament?.title, matchesPlayed: played, wins, draws, losses,
        winRate: played ? Math.round(wins / played * 100) : 0, goalsFor, goalsAgainst, goalDifference: goalsFor - goalsAgainst,
        goalsPerMatch: played ? Number((goalsFor / played).toFixed(2)) : 0,
        goalsAgainstPerMatch: played ? Number((goalsAgainst / played).toFixed(2)) : 0,
        cleanSheets: Math.max(1, Math.round(wins * .6)), possessionAvg: [56, 54, 51, 49, 47][index % 5],
        passAccuracy: 78 + index % 8, shotsPerMatch: Number((11.5 + goalsFor / (played || 1) * 1.8).toFixed(1)),
        yellowCards: 14 + index * 3, redCards: index % 2, points: standing?.points ?? stats.points ?? 0,
        recentForm: team.recentForm, topScorer: scorer ? { name: scorer.name, goals: scorer.goals, avatarUrl: scorer.avatarUrl } : { name: 'Collectif', goals: goalsFor },
        topAssister: assister ? { name: assister.name, assists: assister.assists, avatarUrl: assister.avatarUrl } : { name: 'Collectif', assists: Math.round(goalsFor * .7) },
      };
    }).sort((a: any, b: any) => b.points - a.points || b.goalDifference - a.goalDifference);
  }

  async playerStats(filters: { teamId?: string; position?: string; searchQuery?: string } = {}) {
    const [players, teams]: any[] = await Promise.all([this.playersService.list(), this.teamsService.list()]);
    let rows = players.map((player: any) => {
      const team = teams.find((item: any) => item.id === player.currentTeamId) || { id: player.currentTeamId || 'team_unknown', name: player.currentTeam || 'Club Libre', logoUrl: FALLBACK_LOGO };
      return { playerId: player.id, name: player.name, avatarUrl: player.avatarUrl, teamId: team.id, teamName: team.name, teamLogo: team.logoUrl, position: player.primaryPosition, strongFoot: player.strongFoot, age: player.age, appearances: player.appearances, minutesPlayed: player.appearances * 84, goals: player.goals, assists: player.assists, rating: player.rating || 7.5, shotsOnTarget: Math.round(player.goals * 2.2 + player.appearances), passAccuracy: 76 + (player.primaryPosition.includes('Milieu') ? 10 : 4), yellowCards: player.yellowCards, redCards: 0, cleanSheets: player.primaryPosition === 'Gardien' ? 8 : undefined };
    });
    if (filters.teamId && filters.teamId !== 'all') rows = rows.filter((item: any) => item.teamId === filters.teamId);
    if (filters.position && filters.position !== 'Tous') rows = rows.filter((item: any) => item.position === filters.position);
    if (filters.searchQuery?.trim()) { const query = filters.searchQuery.toLowerCase(); rows = rows.filter((item: any) => `${item.name} ${item.teamName}`.toLowerCase().includes(query)); }
    return rows.sort((a: any, b: any) => b.rating - a.rating || b.goals - a.goals);
  }
}
