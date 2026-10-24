import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { buildTournamentStandings } from './tournament-standings.js';
import { UserContext } from '../auth/user-context.js';
import { APP_SECTIONS, NOTIFICATION_TYPES, TOURNAMENT_STATUSES } from '../../types/domain.js';
import { isDateOnOrBeforeToday } from '../../utils/date.utils.js';
import { normalizeSearchText, slugify, splitDelimitedText } from '../../utils/text.utils.js';
import { isFiniteNumberInRange, isIntegerInRange } from '../../utils/number.utils.js';
import { sanitizePlainText } from '../../utils/sanitize.utils.js';
import type { MatchRecord, PitchRecord, TeamRecord, TournamentRecord } from '../../types/records.js';

export interface CreateTournamentInput {
  title: string;
  format: string;
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  bannerUrl: string;
  organizer: string;
}

@Injectable()
export class TournamentsService {
  constructor(
    private readonly records: RecordRepository,
    private readonly notifications: NotificationsService,
    private readonly userContext: UserContext,
  ) {}

  async list() {
    const [tournaments, teams, matches, pitches] = await Promise.all([
      this.records.list<TournamentRecord>('tournaments'), this.records.list<TeamRecord>('teams'), this.records.list<MatchRecord>('matches'), this.records.list<PitchRecord>('pitches'),
    ]);
    return tournaments.map((tournament) => this.withComputedDetails(tournament, teams, matches, pitches));
  }

  async getById(id: string) {
    const [tournament, teams, matches, pitches] = await Promise.all([
      this.records.find<TournamentRecord>('tournaments', id), this.records.list<TeamRecord>('teams'), this.records.list<MatchRecord>('matches'), this.records.list<PitchRecord>('pitches'),
    ]);
    if (!tournament) return null;
    return this.withComputedDetails(tournament, teams, matches, pitches);
  }

  private withComputedDetails(tournament: TournamentRecord, teams: TeamRecord[], matches: MatchRecord[], pitches: PitchRecord[]) {
    const { organizerId: _organizerId, ...publicTournament } = tournament;
    const participantTeamIds: string[] = tournament.participantTeamIds ?? [];
    const participatingTeams = participantTeamIds.flatMap((teamId) => {
      const team = teams.find((item) => item.id === teamId);
      if (!team) return [];
      const { ownerId: _ownerId, managerIds: _managerIds, ...publicTeam } = team;
      return [publicTeam];
    });
    const cityTerms = splitDelimitedText(tournament.city).map((city) => normalizeSearchText(city));
    const venue = normalizeSearchText(tournament.venue);
    const associatedPitches = pitches.filter((pitch) => {
      const pitchCities = splitDelimitedText(pitch.city).map((city) => normalizeSearchText(city));
      return cityTerms.some((city) => pitchCities.some((pitchCity: string) => city === pitchCity
        || city.includes(pitchCity) || pitchCity.includes(city)))
        || venue.includes(normalizeSearchText(pitch.complexName));
    });
    const matchStadiums = matches.filter((match) => match.tournamentId === tournament.id && match.venue)
      .map((match) => {
        const pitch = pitches.find((item) => item.id === match.pitchId);
        return {
          id: pitch?.id ?? `${tournament.id}_venue_${slugify(String(match.venue))}`,
          name: pitch?.complexName || pitch?.name || match.venue,
          pitchId: pitch?.id,
          city: pitch?.city || match.city,
          address: pitch?.address,
        };
      });
    const uniqueMatchStadiums = [...new Map(matchStadiums.map((stadium) => [stadium.id, stadium])).values()];
    const registrationOpen = tournament.status === TOURNAMENT_STATUSES.REGISTRATION_OPEN && !this.hasStarted(tournament.startDate);
    const stadiums = uniqueMatchStadiums.length
      ? uniqueMatchStadiums
      : associatedPitches.length
        ? associatedPitches.map((pitch) => ({ id: pitch.id, name: pitch.complexName || pitch.name, pitchId: pitch.id, city: pitch.city, address: pitch.address }))
      : splitDelimitedText(tournament.venue, /[;&,]+/)
        .map((name: string, index: number) => ({ id: `${tournament.id}_venue_${index}`, name, city: tournament.city }));

    return {
      ...publicTournament,
      participantTeamIds,
      registeredTeams: participantTeamIds.length,
      remainingTeams: Math.max(0, Number(tournament.maxTeams || 0) - participantTeamIds.length),
      participatingTeams,
      stadiums,
      registrationOpen,
      standings: buildTournamentStandings({ ...tournament, participantTeamIds }, teams, matches),
    };
  }

  async create(input: CreateTournamentInput) {
    const organizerId = this.userContext.userId;
    if (!organizerId) throw new UnauthorizedException('Authentification requise pour créer un tournoi.');
    const id = `tourn_${randomUUID()}`;
    if (!isIntegerInRange(input.maxTeams, 2, 128)
      || !isFiniteNumberInRange(input.entryFee, 0, 1_000_000_000)
      || !isFiniteNumberInRange(input.prizePool, 0, 1_000_000_000)) {
      throw new BadRequestException('Les valeurs numériques du tournoi sont invalides.');
    }
    const tournament: TournamentRecord = {
      ...input,
      title: sanitizePlainText(input.title, 120),
      city: sanitizePlainText(input.city, 100),
      venue: sanitizePlainText(input.venue, 200),
      organizer: sanitizePlainText(input.organizer, 120),
      id, organizerId, registeredTeams: 0, participantTeamIds: [], status: TOURNAMENT_STATUSES.REGISTRATION_OPEN, standings: [], fixtures: [],
    };
    await this.records.create('tournaments', id, tournament);
    await this.notifications.add({ title: 'Nouveau tournoi ouvert', message: `Le tournoi "${input.title}" est maintenant ouvert aux inscriptions !`, type: NOTIFICATION_TYPES.SYSTEM, targetSection: APP_SECTIONS.TOURNAMENTS, targetId: id });
    const { organizerId: _organizerId, ...publicTournament } = tournament;
    return publicTournament;
  }

  async register(id: string, teamId: string) {
    if (!teamId?.trim()) throw new BadRequestException('Une équipe doit être sélectionnée.');
    const userId = this.userContext.userId;
    if (!userId) throw new UnauthorizedException('Authentification requise pour inscrire une équipe.');
    const tournament = await this.getById(id);
    if (!tournament) throw new NotFoundException('Tournoi introuvable.');
    if (tournament.status !== TOURNAMENT_STATUSES.REGISTRATION_OPEN || this.hasStarted(tournament.startDate)) {
      throw new ConflictException('Les inscriptions sont fermées car ce tournoi a commencé.');
    }
    if (tournament.maxTeams !== undefined && tournament.registeredTeams >= tournament.maxTeams) throw new ConflictException('Ce tournoi est complet.');
    const team = await this.records.find<TeamRecord>('teams', teamId);
    if (!team) throw new NotFoundException('Équipe introuvable.');
    if (team.ownerId !== userId && !team.managerIds?.includes(userId)) {
      throw new ForbiddenException('Seul le propriétaire ou un responsable de cette équipe peut l’inscrire.');
    }
    const participantTeamIds: string[] = tournament.participantTeamIds ?? [];
    if (participantTeamIds.includes(teamId)) throw new ConflictException('Cette équipe participe déjà au tournoi.');
    await this.records.save('tournaments', id, {
      ...tournament,
      participantTeamIds: [...participantTeamIds, teamId],
      registeredTeams: participantTeamIds.length + 1,
    });
    await this.notifications.add({
      title: 'Inscription au tournoi',
      message: `L'équipe ${team.name} est pré-inscrite pour ${tournament.title}.`,
      type: NOTIFICATION_TYPES.SYSTEM, targetSection: APP_SECTIONS.TOURNAMENTS, targetId: id,
      ...(team.ownerId ? { recipientId: team.ownerId } : {}),
    });
    return true;
  }

  private hasStarted(value: unknown) {
    return isDateOnOrBeforeToday(value);
  }
}
