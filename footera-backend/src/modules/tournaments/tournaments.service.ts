import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { buildTournamentStandings } from './tournament-standings.js';
import type { MatchRecord, PitchRecord, TeamRecord, TournamentRecord } from '../../database/domain-records.js';

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
  constructor(private readonly records: RecordRepository, private readonly notifications: NotificationsService) {}

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
    const participantTeamIds: string[] = tournament.participantTeamIds ?? [];
    const participatingTeams = participantTeamIds.flatMap((teamId) => {
      const team = teams.find((item) => item.id === teamId);
      if (!team) return [];
      const { ownerId: _ownerId, managerIds: _managerIds, ...publicTeam } = team;
      return [publicTeam];
    });
    const cityTerms = String(tournament.city ?? '').toLocaleLowerCase()
      .split(/[,;&/]+/).map((value) => value.trim()).filter(Boolean);
    const venue = String(tournament.venue ?? '').toLocaleLowerCase();
    const associatedPitches = pitches.filter((pitch) => {
      const pitchCities = String(pitch.city ?? '').toLocaleLowerCase()
        .split(/[,;&/]+/).map((value) => value.trim()).filter(Boolean);
      return cityTerms.some((city) => pitchCities.some((pitchCity: string) => city === pitchCity
        || city.includes(pitchCity) || pitchCity.includes(city)))
        || venue.includes(String(pitch.complexName ?? '').toLocaleLowerCase());
    });
    const matchStadiums = matches.filter((match) => match.tournamentId === tournament.id && match.venue)
      .map((match) => {
        const pitch = pitches.find((item) => item.id === match.pitchId);
        return {
          id: pitch?.id ?? `${tournament.id}_venue_${String(match.venue).toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: pitch?.complexName || pitch?.name || match.venue,
          pitchId: pitch?.id,
          city: pitch?.city || match.city,
          address: pitch?.address,
        };
      });
    const uniqueMatchStadiums = [...new Map(matchStadiums.map((stadium) => [stadium.id, stadium])).values()];
    const registrationOpen = tournament.status === 'INSCRIPTIONS_OUVERTES' && !this.hasStarted(tournament.startDate);
    const stadiums = uniqueMatchStadiums.length
      ? uniqueMatchStadiums
      : associatedPitches.length
        ? associatedPitches.map((pitch) => ({ id: pitch.id, name: pitch.complexName || pitch.name, pitchId: pitch.id, city: pitch.city, address: pitch.address }))
      : String(tournament.venue ?? '').split(/[;&,]+/).map((name: string) => name.trim()).filter(Boolean)
        .map((name: string, index: number) => ({ id: `${tournament.id}_venue_${index}`, name, city: tournament.city }));

    return {
      ...tournament,
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
    const id = `tourn_${randomUUID()}`;
    const tournament = { ...input, id, registeredTeams: 0, participantTeamIds: [], status: 'INSCRIPTIONS_OUVERTES', standings: [], fixtures: [] };
    await this.records.create('tournaments', id, tournament);
    await this.notifications.add({ title: 'Nouveau tournoi ouvert', message: `Le tournoi "${input.title}" est maintenant ouvert aux inscriptions !`, type: 'system', targetSection: 'tournaments', targetId: id });
    return tournament;
  }

  async register(id: string, teamId: string) {
    if (!teamId?.trim()) throw new BadRequestException('Une équipe doit être sélectionnée.');
    const tournament = await this.getById(id);
    if (!tournament) throw new NotFoundException('Tournoi introuvable.');
    if (tournament.status !== 'INSCRIPTIONS_OUVERTES' || this.hasStarted(tournament.startDate)) {
      throw new ConflictException('Les inscriptions sont fermées car ce tournoi a commencé.');
    }
    if (tournament.maxTeams !== undefined && tournament.registeredTeams >= tournament.maxTeams) throw new ConflictException('Ce tournoi est complet.');
    const team = await this.records.find<TeamRecord>('teams', teamId);
    if (!team) throw new NotFoundException('Équipe introuvable.');
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
      type: 'system', targetSection: 'tournaments', targetId: id,
      ...(team.ownerId ? { recipientId: team.ownerId } : {}),
    });
    return true;
  }

  private hasStarted(value: unknown) {
    if (typeof value !== 'string') return false;
    let dateKey = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
    if (!dateKey) {
      const match = value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
      const months: Record<string, string> = {
        janvier: '01', fevrier: '02', mars: '03', avril: '04', mai: '05', juin: '06',
        juillet: '07', aout: '08', septembre: '09', octobre: '10', novembre: '11', decembre: '12',
      };
      const month = match ? months[match[2]] : undefined;
      if (match && month) dateKey = `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
    }
    return Boolean(dateKey) && dateKey <= new Date().toISOString().slice(0, 10);
  }
}
