import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { buildTeamMatchSummary } from './team-match-summary.js';

@Injectable()
export class TeamsService {
  constructor(
    private readonly records: RecordRepository,
    private readonly accounts: AccountsService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(filters: { query?: string; category?: string; city?: string } = {}) {
    const [teams, matches] = await Promise.all([
      this.records.list<any>('teams'),
      this.records.list<any>('matches'),
    ]);
    return teams.filter((team) => {
      const query = filters.query?.toLowerCase();
      const city = filters.city?.toLowerCase();
      return (!query || `${team.name} ${team.city}`.toLowerCase().includes(query))
        && (!filters.category || filters.category === 'Toutes' || team.category === filters.category)
        && (!city || city === 'toutes' || team.city.toLowerCase().includes(city));
    }).map((team) => {
      const { recentForm } = buildTeamMatchSummary(team.id, matches);
      return {
        ...team,
        recentForm,
        stats: {
          ...team.stats,
          goalsPerMatch: team.stats?.matchesPlayed
            ? Number((team.stats.goalsFor / team.stats.matchesPlayed).toFixed(2))
            : 0,
        },
      };
    });
  }

  getById(id: string) { return this.records.find('teams', id); }

  async getDetail(id: string) {
    const [team, matches] = await Promise.all([
      this.records.find<any>('teams', id),
      this.records.list<any>('matches'),
    ]);
    if (!team) return null;
    return {
      ...team,
      ...buildTeamMatchSummary(id, matches),
      topScorers: [...(team.members || [])]
        .sort((left: any, right: any) => Number(right.goals || 0) - Number(left.goals || 0))
        .slice(0, 3)
        .map((member: any) => ({ playerId: member.playerId, playerName: member.name, goals: Number(member.goals || 0) })),
      stats: {
        ...team.stats,
        goalsPerMatch: team.stats?.matchesPlayed
          ? Number((team.stats.goalsFor / team.stats.matchesPlayed).toFixed(2))
          : 0,
      },
    };
  }

  async myTeam() {
    const user: any = await this.accounts.profile();
    const teams: any[] = await this.list();
    return teams.find((team) => team.name === user?.sportsCv?.currentTeam) || teams[0] || null;
  }

  async invitePlayer(playerId: string, message: string) {
    const [team, player, user]: [any, any, any] = await Promise.all([
      this.myTeam(),
      this.records.find<any>('players', playerId),
      this.accounts.profile(),
    ]);
    if (!team) throw new NotFoundException('Votre équipe est introuvable.');
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
      recipientId: playerId, invitationId: id, invitationStatus: invitation.status,
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
    const team: any = await this.getById(id);
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
