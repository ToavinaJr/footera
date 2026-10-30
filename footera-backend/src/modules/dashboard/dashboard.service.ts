import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';
import { UserContext } from '../auth/user-context.js';
import type { MatchRecord, PlayerRecord, TeamRecord, UserRecord } from '../../types/records.js';

export function currentTeam(user: UserRecord, players: PlayerRecord[], teams: TeamRecord[]) {
  const player = players.find((item) => item.userId === user.id || item.id === user.id);
  const profileTeamName = user.sportsCv?.currentTeam?.trim() || player?.currentTeam?.trim();
  return teams.find((team) => team.id === player?.currentTeamId)
    ?? teams.find((team) => team.members?.some((member) => member.playerId === player?.id || member.playerId === user.id))
    ?? (profileTeamName
      ? teams.find((team) => team.name.trim().toLocaleLowerCase() === profileTeamName.toLocaleLowerCase()
        || team.clubName?.trim().toLocaleLowerCase() === profileTeamName.toLocaleLowerCase())
      : undefined)
    ?? teams.find((team) => team.ownerId === user.id || team.managerIds?.includes(user.id))
    ?? null;
}

export function matchTime(match: MatchRecord): number {
  const value = Date.parse(match.scheduledAt || `${match.date}T${match.time || '00:00'}:00Z`);
  return Number.isFinite(value) ? value : Infinity;
}

const teamSummary = (team: TeamRecord) => ({ id: team.id, name: team.name, logoUrl: team.logoUrl ?? '', city: team.city ?? '', division: team.division ?? '', membersCount: team.members?.length ?? team.membersCount ?? 0 });
const matchSummary = (match: MatchRecord) => ({ id: match.id, status: match.status, scheduledAt: match.scheduledAt, date: match.date, time: match.time, venue: match.venue, competition: match.competition, homeTeam: match.homeTeam, awayTeam: match.awayTeam });
const newest = <T extends { createdAt?: string }>(items: T[]) => items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 8);

@Injectable()
export class DashboardService {
  constructor(private readonly records: RecordRepository, private readonly context: UserContext) {}

  async get() {
    if (!this.context.userId) throw new UnauthorizedException();
    const user = await this.records.find('users', this.context.userId);
    if (!user) throw new UnauthorizedException();
    const [players, teams, matches, tournaments, bookings, applications, notifications, roleRequests, activity] = await Promise.all([
      this.records.list('players'), this.records.list('teams'), this.records.list('matches'), this.records.list('tournaments'),
      this.records.list('bookings'), this.records.list('applications'), this.records.list('notifications'), this.records.list('roleRequests'), this.records.list('activity'),
    ]);
    const team = currentTeam(user, players, teams);
    const nextMatch = matches.filter((match) => team && [match.homeTeam.id, match.awayTeam.id].includes(team.id)
      && (match.status === 'LIVE' || (match.status === 'SCHEDULED' && Number.isFinite(matchTime(match)) && matchTime(match) >= Date.now())))
      .sort((a, b) => Number(b.status === 'LIVE') - Number(a.status === 'LIVE') || matchTime(a) - matchTime(b))[0];
    const myNotifications = notifications.filter((item) => item.recipientId === user.id);
    const myApplications = applications.filter((item) => item.userId === user.id);
    const myBookings = bookings.filter((item) => item.userId === user.id);
    return {
      myTeam: team ? teamSummary(team) : null,
      canManageTeam: !!team && (team.ownerId === user.id || team.managerIds?.includes(user.id) === true),
      nextTeamMatch: nextMatch ? matchSummary(nextMatch) : null,
      favoritePlayers: players.filter((item) => user.favoritePlayerIds?.includes(item.id)).slice(0, 6).map((item) => ({ id: item.id, name: item.name, avatarUrl: item.avatarUrl ?? '', primaryPosition: item.primaryPosition ?? '', currentTeam: item.currentTeam ?? '' })),
      favoriteTeams: teams.filter((item) => user.favoriteTeamIds?.includes(item.id)).slice(0, 6).map(teamSummary),
      followedMatches: matches.filter((item) => user.favoriteMatchIds?.includes(item.id)).sort((a, b) => Number(b.status === 'LIVE') - Number(a.status === 'LIVE') || matchTime(a) - matchTime(b)).slice(0, 6).map(matchSummary),
      favoriteTournaments: tournaments.filter((item) => user.favoriteTournamentIds?.includes(item.id)).slice(0, 6).map((item) => ({ id: item.id, title: item.title ?? '', status: item.status, city: item.city, startDate: item.startDate })),
      bookings: newest(myBookings).map((item) => ({ id: item.id, pitchId: item.pitchId, pitchName: item.pitchName, date: item.date, time: item.time, status: item.status })),
      applications: myApplications.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 6).map((item) => ({ id: item.id, adId: item.adId, title: String(item.adTitle ?? ''), teamName: String(item.teamName ?? ''), status: item.status })),
      pendingActions: {
        applications: myApplications.filter((item) => item.status === 'EN_REVUE').length,
        bookings: myBookings.filter((item) => item.status !== 'CANCELLED' && Date.parse(`${item.date}T${item.time}:00Z`) >= Date.now()).length,
        roles: roleRequests.filter((item) => item.userId === user.id && item.status === 'PENDING').length,
      },
      personalActivity: user.preferences?.showPersonalActivity === false ? [] : newest(myNotifications).map((item) => ({ id: item.id, title: item.title, description: item.message, createdAt: item.createdAt, targetSection: item.targetSection, targetId: item.targetId })),
      // Explicit projection: the public feed never includes private notifications.
      platformActivity: activity.filter((item) => !item.recipientId && !item.userId && item.visibility !== 'private')
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 10)
        .map((item) => ({ id: item.id, title: String(item.title ?? item.type), description: String(item.description ?? ''), createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined, targetSection: typeof item.targetSection === 'string' ? item.targetSection : undefined, targetId: typeof item.targetId === 'string' ? item.targetId : undefined })),
    };
  }
}
