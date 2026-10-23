import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { buildTeamMatchSummary } from './team-match-summary.js';
import { buildTournamentStandings } from '../tournaments/tournament-standings.js';
import { aggregatePlayerMatchStats } from '../players/player-match-stats.js';
import type { MatchRecord, PlayerRecord, TeamInvitationRecord, TeamMemberRecord, TeamRecord, TournamentRecord, UserRecord } from '../../types/records.js';
import { APP_SECTIONS, MATCH_STATUSES, NOTIFICATION_TYPES, TEAM_INVITATION_STATUSES } from '../../types/domain.js';

export interface EnrichedTeamMember extends TeamMemberRecord {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: null;
  competitionStats: Array<{ competitionId: string; appearances: number; goals: number; assists: number; yellowCards: number; redCards: number; minutesPlayed: null }>;
}

@Injectable()
export class TeamsService {
  constructor(
    private readonly records: RecordRepository,
    private readonly accounts: AccountsService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(filters: { query?: string; category?: string; city?: string } = {}) {
    const [teams, matches, tournaments, players] = await Promise.all([
      this.records.list<TeamRecord>('teams'),
      this.records.list<MatchRecord>('matches'),
      this.records.list<TournamentRecord>('tournaments'),
      this.records.list<PlayerRecord>('players'),
    ]);
    const filteredTeams = teams.filter((team) => {
      const query = filters.query?.toLowerCase();
      const city = filters.city?.toLowerCase();
      return (!query || `${team.name} ${team.city}`.toLowerCase().includes(query))
        && (!filters.category || filters.category === 'Toutes' || team.category === filters.category)
        && (!city || city === 'toutes' || (team.city ?? '').toLowerCase().includes(city));
    });
    return Promise.all(filteredTeams.map(async (sourceTeam) => {
      const { team } = await this.ensureTeamMemberProfiles(sourceTeam, players);
      const { recentForm } = buildTeamMatchSummary(team.id, this.matchesForTeamCompetition(team, matches));
      const { ownerId: _ownerId, managerIds: _managerIds, ...publicTeam } = team;
      const stats = this.getComputedTeamStats(team, teams, matches, tournaments);
      return {
        ...publicTeam,
        membersCount: team.members?.length ?? 0,
        recentForm,
        stats,
      };
    }));
  }

  async getById(id: string) {
    const [team, teams, matches, tournaments, players] = await Promise.all([
      this.records.find<TeamRecord>('teams', id), this.records.list<TeamRecord>('teams'), this.records.list<MatchRecord>('matches'), this.records.list<TournamentRecord>('tournaments'), this.records.list<PlayerRecord>('players'),
    ]);
    if (!team) return null;
    const { team: synchronizedTeam } = await this.ensureTeamMemberProfiles(team, players);
    const { ownerId: _ownerId, managerIds: _managerIds, ...publicTeam } = synchronizedTeam;
    return { ...publicTeam, membersCount: synchronizedTeam.members?.length ?? 0, stats: this.getComputedTeamStats(team, teams, matches, tournaments) };
  }

  async getDetail(id: string, filters: { competitionId?: string; sortBy?: 'goals' | 'assists' | 'appearances' | 'yellowCards' | 'redCards' } = {}) {
    const [team, teams, matches, tournaments, players, users] = await Promise.all([
      this.records.find<TeamRecord>('teams', id),
      this.records.list<TeamRecord>('teams'),
      this.records.list<MatchRecord>('matches'),
      this.records.list<TournamentRecord>('tournaments'),
      this.records.list<PlayerRecord>('players'),
      this.records.list<UserRecord>('users'),
    ]);
    if (!team) return null;
    const synchronized = await this.ensureTeamMemberProfiles(team, players);
    const { ownerId: _ownerId, managerIds: _managerIds, ...publicTeam } = synchronized.team;
    const competitions = tournaments.filter((tournament) =>
      tournament.participantTeamIds?.includes(id) || tournament.id === team.competitionId)
      .map((tournament) => ({ id: tournament.id, title: tournament.title }));
    const teamCompetitionIds = new Set(competitions.map((competition) => competition.id));
    const teamCompetitionMatches = matches.filter((match) => match.tournamentId !== undefined && teamCompetitionIds.has(match.tournamentId));
    const primaryCompetitionMatches = this.matchesForTeamCompetition(team, matches);
    const playerStats = aggregatePlayerMatchStats(synchronized.players, teamCompetitionMatches, { teamId: id }, competitions.length ? tournaments : []);
    const statsByCompetition = new Map(competitions.map((competition) => [
      competition.id,
      aggregatePlayerMatchStats(synchronized.players, teamCompetitionMatches, { teamId: id, competitionId: competition.id }, tournaments),
    ]));
    const teamMembers: TeamMemberRecord[] = synchronized.team.members || [];
    const membersByPlayerId = new Map<string, EnrichedTeamMember>();
    for (const player of synchronized.players) {
      const rosterEntry = teamMembers.find((member) =>
        member.playerId === player.id || (player.userId && member.playerId === player.userId));
      if (!rosterEntry && player.currentTeamId !== id) continue;

      const user = users.find((candidate) => candidate.id === player.userId);
      const memberId = player.id;
      const stats = playerStats.get(memberId);
      const competitionStats = competitions.map((competition) => {
        const competitionTotals = statsByCompetition.get(competition.id)?.get(memberId);
        return {
          competitionId: competition.id,
          appearances: competitionTotals?.appearances ?? 0,
          goals: competitionTotals?.goals ?? 0,
          assists: competitionTotals?.assists ?? 0,
          yellowCards: competitionTotals?.yellowCards ?? 0,
          redCards: competitionTotals?.redCards ?? 0,
          minutesPlayed: null,
        };
      });
      membersByPlayerId.set(memberId, {
        ...rosterEntry,
        playerId: memberId,
        name: player.name,
        position: player.primaryPosition || rosterEntry?.position || 'Joueur',
        jerseyNumber: rosterEntry?.jerseyNumber,
        role: rosterEntry?.role || 'Joueur',
        avatarUrl: user?.avatarUrl || player.avatarUrl || rosterEntry?.avatarUrl || '',
        age: player.age,
        appearances: stats?.appearances ?? 0,
        goals: stats?.goals ?? 0,
        assists: stats?.assists ?? 0,
        yellowCards: stats?.yellowCards ?? 0,
        redCards: stats?.redCards ?? 0,
        minutesPlayed: null,
        competitionStats,
      } as EnrichedTeamMember);
    }
    const members = [...membersByPlayerId.values()].map((member) => {
      const selectedStats = filters.competitionId && filters.competitionId !== 'all'
        ? member.competitionStats.find((stats) => stats.competitionId === filters.competitionId)
        : undefined;
      return selectedStats ? { ...member, ...selectedStats } : member;
    }).sort((left, right) => {
      const sortBy = filters.sortBy ?? 'goals';
      return (right[sortBy] ?? 0) - (left[sortBy] ?? 0);
    });
    const topScorers = members
      .filter((member) => member.goals > 0)
      .sort((left, right) => right.goals - left.goals)
      .slice(0, 3)
      .map((member) => ({ playerId: member.playerId, playerName: member.name, goals: member.goals }));
    return {
      ...publicTeam,
      members,
      membersCount: members.length,
      competitions,
      ...buildTeamMatchSummary(id, primaryCompetitionMatches),
      topScorers,
      stats: this.getComputedTeamStats(team, teams, matches, tournaments),
    };
  }

  private async ensureTeamMemberProfiles(team: TeamRecord, players: PlayerRecord[]) {
    const profiles = [...players];
    const seen = new Set<string>();
    const members: TeamMemberRecord[] = [];
    let changed = false;
    for (const entry of team.members || []) {
      let player = profiles.find((candidate) => candidate.id === entry.playerId || candidate.userId === entry.playerId);
      if (!player) {
        player = { id: randomUUID(), name: entry.name, primaryPosition: entry.position || 'Joueur', avatarUrl: entry.avatarUrl, currentTeam: team.name, currentTeamId: team.id };
        await this.records.save('players', player.id, player);
        profiles.push(player);
        changed = true;
      } else if (player.currentTeamId !== team.id) {
        player = { ...player, currentTeam: team.name, currentTeamId: team.id };
        await this.records.save('players', player.id, player);
        profiles[profiles.findIndex((candidate) => candidate.id === player?.id)] = player;
        changed = true;
      }
      if (seen.has(player.id)) { changed = true; continue; }
      seen.add(player.id);
      members.push({ ...entry, playerId: player.id, name: player.name, position: player.primaryPosition || entry.position });
      if (entry.playerId !== player.id || entry.name !== player.name) changed = true;
    }
    for (const player of profiles.filter((candidate) => candidate.currentTeamId === team.id)) {
      if (seen.has(player.id)) continue;
      seen.add(player.id);
      members.push({ playerId: player.id, name: player.name, position: player.primaryPosition || 'Joueur', role: 'Joueur', avatarUrl: player.avatarUrl });
      changed = true;
    }
    const synchronizedTeam = { ...team, members, membersCount: members.length };
    if (changed || team.membersCount !== members.length) await this.records.save('teams', team.id, synchronizedTeam);
    return { team: synchronizedTeam, players: profiles };
  }

  private matchesForTeamCompetition(team: TeamRecord, matches: MatchRecord[]) {
    return team.competitionId
      ? matches.filter((match) => match.tournamentId === team.competitionId)
      : matches.filter((match) => !match.tournamentId);
  }

  private getComputedTeamStats(team: TeamRecord, teams: TeamRecord[], matches: MatchRecord[], tournaments: TournamentRecord[]) {
    const competition = tournaments.find((item) => item.id === team.competitionId)
      ?? tournaments.find((item) => item.title?.toLowerCase().includes('championnat')
        && item.participantTeamIds?.includes(team.id));
    const standing = competition
      ? buildTournamentStandings(competition, teams, matches).find((row) => row.teamId === team.id)
      : undefined;
    const playedMatches = this.matchesForTeamCompetition({ ...team, competitionId: competition?.id }, matches)
      .filter((match) => match.status === MATCH_STATUSES.FINISHED && (match.homeTeam?.id === team.id || match.awayTeam?.id === team.id));
    const goalsFor = standing?.goalsFor ?? 0;
    const goalsAgainst = standing?.goalsAgainst ?? 0;
    return {
      matchesPlayed: standing?.played ?? 0,
      wins: standing?.won ?? 0,
      draws: standing?.drawn ?? 0,
      losses: standing?.lost ?? 0,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      goalsPerMatch: standing?.played ? Number((goalsFor / standing.played).toFixed(2)) : 0,
      points: standing?.points ?? 0,
      position: standing?.position ?? 0,
      competitionId: competition?.id,
      cleanSheets: playedMatches.filter((match) => (match.homeTeam.id === team.id ? match.awayTeam.score : match.homeTeam.score) === 0).length,
    };
  }

  async myTeam() {
    const user = await this.accounts.profile();
    const teams = await this.records.list<TeamRecord>('teams');
    return teams.find((team) => team.ownerId === user?.id || (user?.id ? team.managerIds?.includes(user.id) : false)) || null;
  }

  async invitePlayer(playerId: string, message: string) {
    const [team, player, user] = await Promise.all([
      this.myTeam(),
      this.records.find<PlayerRecord>('players', playerId),
      this.accounts.profile(),
    ]);
    if (!team) throw new NotFoundException('Votre équipe est introuvable.');
    if (!user?.roles?.some((role: string) => ['Entraîneur', 'Organisateur Tournoi'].includes(role))) {
      throw new ForbiddenException('Seul le staff de l’équipe peut inviter un joueur.');
    }
    if (!player) throw new NotFoundException('Joueur introuvable.');
    if (team.members?.some((member) => member.playerId === playerId)) {
      throw new ConflictException('Ce joueur fait déjà partie de votre équipe.');
    }
    const trimmedMessage = message?.trim();
    if (!trimmedMessage || trimmedMessage.length > 500) {
      throw new BadRequestException('Le message doit contenir entre 1 et 500 caractères.');
    }

    const invitations = await this.records.list<TeamInvitationRecord>('teamInvitations');
    if (invitations.some((invitation) =>
      invitation.teamId === team.id && invitation.playerId === playerId && invitation.status === TEAM_INVITATION_STATUSES.PENDING)) {
      throw new ConflictException('Une invitation est déjà en attente pour ce joueur.');
    }

    const id = `team_invite_${randomUUID()}`;
    const createdAt = new Date().toISOString();
    const invitation = {
      id, teamId: team.id, teamName: team.name, playerId, playerName: player.name,
      senderId: user?.id, senderName: user?.name, message: trimmedMessage,
      status: TEAM_INVITATION_STATUSES.PENDING, createdAt, updatedAt: createdAt,
    };
    await this.records.create('teamInvitations', id, invitation);
    await this.notifications.add({
      title: `Invitation de ${team.name}`,
      message: `${team.name} vous propose de rejoindre son équipe. ${trimmedMessage}`,
      type: NOTIFICATION_TYPES.TEAM, targetSection: APP_SECTIONS.TEAMS, targetId: team.id,
      recipientId: player.userId || player.id, invitationId: id, invitationStatus: invitation.status,
    });
    return { success: true, invitation, message: `Invitation envoyée à ${player.name}.` };
  }

  async listMyTeamInvitations() {
    const team = await this.myTeam();
    if (!team) return [];
    const invitations = await this.records.list<TeamInvitationRecord>('teamInvitations');
    return invitations.filter((invitation) => invitation.teamId === team.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async join(id: string, message: string) {
    const team = await this.records.find<TeamRecord>('teams', id);
    if (!team) return { success: false, message: 'Équipe introuvable' };
    const user = await this.accounts.profile();
    if (!user) return { success: false, message: 'Utilisateur non authentifié' };
    const members = team.members || [];
    const existingPlayers = await this.records.list<PlayerRecord>('players');
    let player = existingPlayers.find((candidate) => candidate.userId === user.id || candidate.id === user.id);
    if (!player) {
      player = { id: randomUUID(), userId: user.id, name: user.name, city: user.city, avatarUrl: user.avatarUrl,
        primaryPosition: user.sportsCv?.primaryPosition || 'Joueur', secondaryPosition: user.sportsCv?.secondaryPosition,
        strongFoot: user.sportsCv?.strongFoot, height: user.sportsCv?.height, weight: user.sportsCv?.weight,
        experienceYears: user.sportsCv?.experienceYears, bio: user.sportsCv?.bio };
      await this.records.save('players', player.id, player);
    }
    if (members.some((member) => member.playerId === player?.id || member.playerId === user.id)) {
      return { success: false, message: 'Vous êtes déjà membre de cette équipe.' };
    }
    player = { ...player, currentTeam: team.name, currentTeamId: team.id };
    await this.records.save('players', player.id, player);
    members.push({ playerId: player.id, name: player.name, position: player.primaryPosition,
      jerseyNumber: user.sportsCv?.preferredNumber, role: 'Joueur', avatarUrl: player.avatarUrl });
    await this.records.save('teams', id, { ...team, members, membersCount: members.length });
    await this.notifications.add({
      title: 'Demande transmise au staff',
      message: `Votre demande pour rejoindre ${team.name} a bien été enregistrée. Message: "${message.slice(0, 40)}..."`,
      type: NOTIFICATION_TYPES.TEAM, targetSection: APP_SECTIONS.TEAMS, targetId: id,
    });
    return { success: true, message: `Bienvenue dans l'équipe ${team.name} !` };
  }

  toggleFavorite(id: string) { return this.accounts.toggleFavoriteTeam(id); }
}
