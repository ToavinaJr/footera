import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { TopScorerItem, TopAssisterItem, TeamStatsItem, PlayerStatsItem, Position } from '../types';

export const statsService = {
  /**
   * Récupère le classement des meilleurs buteurs, avec filtres par tournoi et par équipe
   */
  async getTopScorers(filters?: { tournamentId?: string; teamId?: string }): Promise<TopScorerItem[]> {
    if (!IS_MOCK_MODE) {
      const params = new URLSearchParams();
      if (filters?.tournamentId && filters.tournamentId !== 'all') params.set('tournamentId', filters.tournamentId);
      if (filters?.teamId && filters.teamId !== 'all') params.set('teamId', filters.teamId);
      return apiClient<TopScorerItem[]>(`stats/top-scorers?${params.toString()}`);
    }
    const players = mockStorage.getPlayers();
    const teams = mockStorage.getTeams();
    const tournaments = mockStorage.getTournaments();

    const selectedTournament = filters?.tournamentId && filters.tournamentId !== 'all'
      ? tournaments.find((t) => t.id === filters.tournamentId)
      : undefined;

    let list = players.map((p) => {
      const team = teams.find((t) => t.id === p.currentTeamId) || {
        id: p.currentTeamId || 'team_unknown',
        name: p.currentTeam || 'Club Libre',
        logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80',
      };

      // Si un tournoi spécifique est sélectionné, on adapte proportionnellement les stats au contexte du tournoi
      let goals = p.goals;
      let matches = p.appearances;

      if (selectedTournament) {
        const teamStanding = selectedTournament.standings.find((s) => s.teamId === team.id);
        const tournMatches = teamStanding ? teamStanding.played : 3;
        matches = Math.max(1, tournMatches);
        // Buts réalistes dans le cadre du tournoi
        goals = Math.max(1, Math.round((p.goals / (p.appearances || 1)) * matches));
      }

      const ratio = matches > 0 ? parseFloat((goals / matches).toFixed(2)) : 0;
      const minutesPerGoal = goals > 0 ? Math.round((matches * 85) / goals) : 0;
      const penalties = Math.max(0, Math.floor(goals * 0.2));

      return {
        rank: 0,
        playerId: p.id,
        playerName: p.name,
        avatarUrl: p.avatarUrl,
        teamId: team.id,
        teamName: team.name,
        teamLogo: team.logoUrl,
        tournamentId: selectedTournament?.id,
        tournamentTitle: selectedTournament?.title,
        position: p.primaryPosition,
        matchesPlayed: matches,
        goals,
        penalties,
        ratio,
        minutesPerGoal,
      };
    });

    // Filtre par équipe si spécifié
    if (filters?.teamId && filters.teamId !== 'all') {
      list = list.filter((item) => item.teamId === filters.teamId);
    }

    // Tri décroissant par buts, puis par ratio
    list.sort((a, b) => b.goals - a.goals || b.ratio - a.ratio);

    // Attribution des rangs
    const ranked = list.map((item, idx) => ({ ...item, rank: idx + 1 }));

    if (IS_MOCK_MODE) {
      return mockDelay(ranked, 150);
    }
    return ranked;
  },

  /**
   * Récupère le classement des meilleurs passeurs, avec filtres par tournoi et par équipe
   */
  async getTopAssisters(filters?: { tournamentId?: string; teamId?: string }): Promise<TopAssisterItem[]> {
    if (!IS_MOCK_MODE) {
      const params = new URLSearchParams();
      if (filters?.tournamentId && filters.tournamentId !== 'all') params.set('tournamentId', filters.tournamentId);
      if (filters?.teamId && filters.teamId !== 'all') params.set('teamId', filters.teamId);
      return apiClient<TopAssisterItem[]>(`stats/top-assisters?${params.toString()}`);
    }
    const players = mockStorage.getPlayers();
    const teams = mockStorage.getTeams();
    const tournaments = mockStorage.getTournaments();

    const selectedTournament = filters?.tournamentId && filters.tournamentId !== 'all'
      ? tournaments.find((t) => t.id === filters.tournamentId)
      : undefined;

    let list = players.map((p) => {
      const team = teams.find((t) => t.id === p.currentTeamId) || {
        id: p.currentTeamId || 'team_unknown',
        name: p.currentTeam || 'Club Libre',
        logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80',
      };

      let assists = p.assists;
      let matches = p.appearances;

      if (selectedTournament) {
        const teamStanding = selectedTournament.standings.find((s) => s.teamId === team.id);
        const tournMatches = teamStanding ? teamStanding.played : 3;
        matches = Math.max(1, tournMatches);
        assists = Math.max(1, Math.round((p.assists / (p.appearances || 1)) * matches));
      }

      const ratio = matches > 0 ? parseFloat((assists / matches).toFixed(2)) : 0;
      const keyPasses = Math.round(assists * 2.8 + matches);

      return {
        rank: 0,
        playerId: p.id,
        playerName: p.name,
        avatarUrl: p.avatarUrl,
        teamId: team.id,
        teamName: team.name,
        teamLogo: team.logoUrl,
        tournamentId: selectedTournament?.id,
        tournamentTitle: selectedTournament?.title,
        position: p.primaryPosition,
        matchesPlayed: matches,
        assists,
        keyPasses,
        ratio,
      };
    });

    if (filters?.teamId && filters.teamId !== 'all') {
      list = list.filter((item) => item.teamId === filters.teamId);
    }

    list.sort((a, b) => b.assists - a.assists || b.ratio - a.ratio);

    const ranked = list.map((item, idx) => ({ ...item, rank: idx + 1 }));

    if (IS_MOCK_MODE) {
      return mockDelay(ranked, 150);
    }
    return ranked;
  },

  /**
   * Statistiques complètes de chaque équipe (attaque, défense, possession, buteurs phares)
   */
  async getTeamsStats(filters?: { tournamentId?: string }): Promise<TeamStatsItem[]> {
    if (!IS_MOCK_MODE) {
      const params = new URLSearchParams();
      if (filters?.tournamentId && filters.tournamentId !== 'all') params.set('tournamentId', filters.tournamentId);
      return apiClient<TeamStatsItem[]>(`stats/teams?${params.toString()}`);
    }
    const teams = mockStorage.getTeams();
    const players = mockStorage.getPlayers();
    const tournaments = mockStorage.getTournaments();

    const selectedTournament = filters?.tournamentId && filters.tournamentId !== 'all'
      ? tournaments.find((t) => t.id === filters.tournamentId)
      : undefined;

    const list: TeamStatsItem[] = teams.map((team, idx) => {
      // Trouver les meilleurs buteurs et passeurs internes à l'équipe
      const teamPlayers = players.filter((p) => p.currentTeamId === team.id || p.currentTeam === team.name);

      const sortedScorers = [...teamPlayers].sort((a, b) => b.goals - a.goals);
      const topScorer = sortedScorers.length > 0
        ? { name: sortedScorers[0].name, goals: sortedScorers[0].goals, avatarUrl: sortedScorers[0].avatarUrl }
        : { name: 'Collectif', goals: team.stats.goalsFor };

      const sortedAssisters = [...teamPlayers].sort((a, b) => b.assists - a.assists);
      const topAssister = sortedAssisters.length > 0
        ? { name: sortedAssisters[0].name, assists: sortedAssisters[0].assists, avatarUrl: sortedAssisters[0].avatarUrl }
        : { name: 'Collectif', assists: Math.round(team.stats.goalsFor * 0.7) };

      // Si un tournoi spécifique est sélectionné, on adapte les stats au tournoi
      let played = team.stats.matchesPlayed;
      let wins = team.stats.wins;
      let draws = team.stats.draws;
      let losses = team.stats.losses;
      let gf = team.stats.goalsFor;
      let ga = team.stats.goalsAgainst;
      let points = team.stats.points;

      if (selectedTournament) {
        const row = selectedTournament.standings.find((s) => s.teamId === team.id);
        if (row) {
          played = row.played;
          wins = row.won;
          draws = row.drawn;
          losses = row.lost;
          gf = row.goalsFor;
          ga = row.goalsAgainst;
          points = row.points;
        }
      }

      const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
      const goalsPerMatch = played > 0 ? parseFloat((gf / played).toFixed(2)) : 0;
      const goalsAgainstPerMatch = played > 0 ? parseFloat((ga / played).toFixed(2)) : 0;

      // Données de possession et précision
      const possessionPresets = [56, 54, 51, 49, 47];
      const possessionAvg = possessionPresets[idx % possessionPresets.length];
      const passAccuracy = 78 + (idx % 8);
      const shotsPerMatch = parseFloat((11.5 + (gf / (played || 1)) * 1.8).toFixed(1));
      const cleanSheets = Math.max(1, Math.round(wins * 0.6));
      const yellowCards = 14 + (idx * 3);
      const redCards = Math.max(0, idx % 2);

      return {
        teamId: team.id,
        teamName: team.name,
        shortName: team.shortName,
        logoUrl: team.logoUrl,
        city: team.city,
        division: team.division,
        tournamentId: selectedTournament?.id,
        tournamentTitle: selectedTournament?.title,
        matchesPlayed: played,
        wins,
        draws,
        losses,
        winRate,
        goalsFor: gf,
        goalsAgainst: ga,
        goalDifference: gf - ga,
        goalsPerMatch,
        goalsAgainstPerMatch,
        cleanSheets,
        possessionAvg,
        passAccuracy,
        shotsPerMatch,
        yellowCards,
        redCards,
        points,
        recentForm: team.recentForm,
        topScorer,
        topAssister,
      };
    });

    // Tri par points décroissants, puis par différence de buts
    list.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);

    if (IS_MOCK_MODE) {
      return mockDelay(list, 150);
    }
    return list;
  },

  /**
   * Statistiques individuelles de tous les joueurs
   */
  async getPlayersStats(filters?: { teamId?: string; position?: Position | 'Tous'; searchQuery?: string }): Promise<PlayerStatsItem[]> {
    if (!IS_MOCK_MODE) {
      const params = new URLSearchParams();
      if (filters?.teamId && filters.teamId !== 'all') params.set('teamId', filters.teamId);
      if (filters?.position && filters.position !== 'Tous') params.set('position', filters.position);
      if (filters?.searchQuery?.trim()) params.set('searchQuery', filters.searchQuery.trim());
      return apiClient<PlayerStatsItem[]>(`stats/players?${params.toString()}`);
    }
    const players = mockStorage.getPlayers();
    const teams = mockStorage.getTeams();

    let list: PlayerStatsItem[] = players.map((p) => {
      const team = teams.find((t) => t.id === p.currentTeamId) || {
        id: p.currentTeamId || 'team_unknown',
        name: p.currentTeam || 'Club Libre',
        logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80',
      };

      const minutesPlayed = p.appearances * 84;
      const shotsOnTarget = Math.round(p.goals * 2.2 + p.appearances);
      const passAccuracy = 76 + (p.primaryPosition.includes('Milieu') ? 10 : 4);
      const cleanSheets = p.primaryPosition === 'Gardien' ? 8 : undefined;

      return {
        playerId: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        teamId: team.id,
        teamName: team.name,
        teamLogo: team.logoUrl,
        position: p.primaryPosition,
        strongFoot: p.strongFoot,
        age: p.age,
        appearances: p.appearances,
        minutesPlayed,
        goals: p.goals,
        assists: p.assists,
        rating: p.rating || 7.5,
        shotsOnTarget,
        passAccuracy,
        yellowCards: p.yellowCards,
        redCards: 0,
        cleanSheets,
      };
    });

    if (filters?.teamId && filters.teamId !== 'all') {
      list = list.filter((p) => p.teamId === filters.teamId);
    }
    if (filters?.position && filters.position !== 'Tous') {
      list = list.filter((p) => p.position === filters.position);
    }
    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q));
    }

    list.sort((a, b) => b.rating - a.rating || b.goals - a.goals);

    if (IS_MOCK_MODE) {
      return mockDelay(list, 150);
    }
    return list;
  },
};
