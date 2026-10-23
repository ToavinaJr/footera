import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { buildTeamMatchSummary } from './team-match-summary.js';
import { buildTournamentStandings } from '../tournaments/tournament-standings.js';
import { aggregatePlayerMatchStats } from '../players/player-match-stats.js';

@Injectable()
export class TeamsService {
  constructor(
    private readonly records: RecordRepository,
    private readonly accounts: AccountsService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(filters: { query?: string; category?: string; city?: string } = {}) {
    const [teams, matches, tournaments] = await Promise.all([
      this.records.list<any>('teams'),
      this.records.list<any>('matches'),
      this.records.list<any>('tournaments'),
    ]);
    return teams.filter((team) => {
      const query = filters.query?.toLowerCase();
      const city = filters.city?.toLowerCase();
      return (!query || `${team.name} ${team.city}`.toLowerCase().includes(query))
        && (!filters.category || filters.category === 'Toutes' || team.category === filters.category)
        && (!city || city === 'toutes' || team.city.toLowerCase().includes(city));
    }).map((team) => {
      const { recentForm } = buildTeamMatchSummary(team.id, this.matchesForTeamCompetition(team, matches));
      const { ownerId: _ownerId, managerIds: _managerIds, ...publicTeam } = team;
      const stats = this.getComputedTeamStats(team, teams, matches, tournaments);
      return {
        ...publicTeam,
        recentForm,
        stats,
      };
    });
  }

  async getById(id: string) {
    const [team, teams, matches, tournaments]: [any, any[], any[], any[]] = await Promise.all([
      this.records.find('teams', id), this.records.list('teams'), this.records.list('matches'), this.records.list('tournaments'),
    ]);
    if (!team) return null;
    const { ownerId: _ownerId, managerIds: _managerIds, ...publicTeam } = team;
    return { ...publicTeam, stats: this.getComputedTeamStats(team, teams, matches, tournaments) };
  }

  async getDetail(id: string) {
    const [team, teams, matches, tournaments, players] = await Promise.all([
      this.records.find<any>('teams', id),
      this.records.list<any>('teams'),
      this.records.list<any>('matches'),
      this.records.list<any>('tournaments'),
      this.records.list<any>('players'),
    ]);
    if (!team) return null;
    const { ownerId: _ownerId, managerIds: _managerIds, ...publicTeam } = team;
    const competitionMatches = this.matchesForTeamCompetition(team, matches);
    const playerStats = aggregatePlayerMatchStats(players, competitionMatches, team.competitionId, tournaments);
    const members = (team.members || []).map((member: any) => {
      const stats = playerStats.get(member.playerId);
      return { ...member, appearances: stats?.appearances ?? 0, goals: stats?.goals ?? 0, assists: stats?.assists ?? 0, yellowCards: stats?.yellowCards ?? 0, redCards: stats?.redCards ?? 0 };
    });
    const topScorers = members
      .filter((member: any) => member.goals > 0)
      .sort((left: any, right: any) => right.goals - left.goals)
      .slice(0, 3)
      .map((member: any) => ({ playerId: member.playerId, playerName: member.name, goals: member.goals }));
    return {
      ...publicTeam,
      members,
      ...buildTeamMatchSummary(id, competitionMatches),
      topScorers,
      stats: this.getComputedTeamStats(team, teams, matches, tournaments),
    };
  }

  private matchesForTeamCompetition(team: any, matches: any[]) {
    return team.competitionId
      ? matches.filter((match) => match.tournamentId === team.competitionId)
      : matches.filter((match) => !match.tournamentId);
  }

  private getComputedTeamStats(team: any, teams: any[], matches: any[], tournaments: any[]) {
    const competition = tournaments.find((item) => item.id === team.competitionId)
      ?? tournaments.find((item) => item.title?.toLowerCase().includes('championnat')
        && item.participantTeamIds?.includes(team.id));
    const standing = competition
      ? buildTournamentStandings(competition, teams, matches).find((row) => row.teamId === team.id)
      : undefined;
    const playedMatches = this.matchesForTeamCompetition({ ...team, competitionId: competition?.id }, matches)
      .filter((match) => match.status === 'FINISHED' && (match.homeTeam?.id === team.id || match.awayTeam?.id === team.id));
    const goalsFor = standing?.goalsFor ?? 0;
    const goalsAgainst = standing?.goalsAgainst ?? 0;
    return {
      matchesPlayed: standing?.played ?? 0,
      wins: standing?.won ?? 0,
      draws: standing?.drawn ?? 0,
      losses: standing?.lost ?? 0,
      goalsFor,
      goalsAgainst,
      goalsPerMatch: standing?.played ? Number((goalsFor / standing.played).toFixed(2)) : 0,
      points: standing?.points ?? 0,
      position: standing?.position ?? 0,
      competitionId: competition?.id,
      cleanSheets: playedMatches.filter((match) => (match.homeTeam.id === team.id ? match.awayTeam.score : match.homeTeam.score) === 0).length,
    };
  }

  async myTeam() {
    const user: any = await this.accounts.profile();
    const teams: any[] = await this.records.list('teams');
    return teams.find((team) => team.ownerId === user?.id || team.managerIds?.includes(user?.id)) || null;
  }

  async invitePlayer(playerId: string, message: string) {
    const [team, player, user]: [any, any, any] = await Promise.all([
      this.myTeam(),
      this.records.find<any>('players', playerId),
      this.accounts.profile(),
    ]);
    if (!team) throw new NotFoundException('Votre équipe est introuvable.');
    if (!user?.roles?.some((role: string) => ['Entraîneur', 'Organisateur Tournoi'].includes(role))) {
      throw new ForbiddenException('Seul le staff de l’équipe peut inviter un joueur.');
    }
    if (!player) throw new NotFoundException('Joueur introuvable.');
    if (team.members?.some((member: any) => member.playerId === playerId)) {
      throw new ConflictException('Ce joueur fait déjà partie de votre équipe.');
    }
    const trimmedMessage = message?.trim();
    if (!trimmedMessage || trimmedMessage.length > 500) {
      throw new BadRequestException('Le message doit contenir entre 1 et 500 caractères.');
    }

    const invitations = await this.records.list<any>('teamInvitations');
    if (invitations.some((invitation) =>
      invitation.teamId === team.id && invitation.playerId === playerId && invitation.status === 'PENDING')) {
      throw new ConflictException('Une invitation est déjà en attente pour ce joueur.');
    }

    const id = `team_invite_${randomUUID()}`;
    const createdAt = new Date().toISOString();
    const invitation = {
      id, teamId: team.id, teamName: team.name, playerId, playerName: player.name,
      senderId: user?.id, senderName: user?.name, message: trimmedMessage,
      status: 'PENDING' as const, createdAt, updatedAt: createdAt,
    };
    await this.records.create('teamInvitations', id, invitation);
    await this.notifications.add({
      title: `Invitation de ${team.name}`,
      message: `${team.name} vous propose de rejoindre son équipe. ${trimmedMessage}`,
      type: 'team', targetSection: 'teams', targetId: team.id,
      recipientId: player.userId || player.id, invitationId: id, invitationStatus: invitation.status,
    });
    return { success: true, invitation, message: `Invitation envoyée à ${player.name}.` };
  }

  async listMyTeamInvitations() {
    const team = await this.myTeam();
    if (!team) return [];
    const invitations = await this.records.list<any>('teamInvitations');
    return invitations.filter((invitation) => invitation.teamId === team.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async join(id: string, message: string) {
    const team: any = await this.records.find('teams', id);
    if (!team) return { success: false, message: 'Équipe introuvable' };
    const user: any = await this.accounts.profile();
    if (!user) return { success: false, message: 'Utilisateur non authentifié' };
    const members = team.members || [];
    if (members.some((member: any) => member.playerId === user.id)) {
      return { success: false, message: 'Vous êtes déjà membre de cette équipe.' };
    }
    members.push({
      playerId: user.id, name: user.name, position: user.sportsCv?.primaryPosition,
      jerseyNumber: user.sportsCv?.preferredNumber || 14, role: 'Joueur',
      avatarUrl: user.avatarUrl, age: 25, matchesPlayed: 0, goals: 0,
    });
    await this.records.save('teams', id, { ...team, members, membersCount: Number(team.membersCount || 0) + 1 });
    await this.notifications.add({
      title: 'Demande transmise au staff',
      message: `Votre demande pour rejoindre ${team.name} a bien été enregistrée. Message: "${message.slice(0, 40)}..."`,
      type: 'team', targetSection: 'teams', targetId: id,
    });
    return { success: true, message: `Bienvenue dans l'équipe ${team.name} !` };
  }

  toggleFavorite(id: string) { return this.accounts.toggleFavoriteTeam(id); }
}
