import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';

@Injectable()
export class TournamentsService {
  constructor(private readonly records: RecordRepository, private readonly notifications: NotificationsService) {}
  async list() {
    const tournaments: any[] = await this.records.list('tournaments');
    return tournaments.map((tournament) => {
      const participantTeamIds = tournament.participantTeamIds ?? tournament.standings?.map((row: any) => row.teamId) ?? [];
      return {
        ...tournament,
        participantTeamIds,
        registeredTeams: participantTeamIds.length,
        remainingTeams: Math.max(0, Number(tournament.maxTeams || 0) - participantTeamIds.length),
      };
    });
  }
  async getById(id: string) {
    const tournament: any = await this.records.find('tournaments', id);
    if (!tournament) return null;
    const participantTeamIds = tournament.participantTeamIds ?? tournament.standings?.map((row: any) => row.teamId) ?? [];
    return {
      ...tournament,
      participantTeamIds,
      registeredTeams: participantTeamIds.length,
      remainingTeams: Math.max(0, Number(tournament.maxTeams || 0) - participantTeamIds.length),
    };
  }
  async create(input: any) {
    const id = `tourn_${randomUUID()}`;
    const tournament = { ...input, id, registeredTeams: 0, participantTeamIds: [], status: 'INSCRIPTIONS_OUVERTES', standings: [], fixtures: [] };
    await this.records.create('tournaments', id, tournament);
    await this.notifications.add({ title: 'Nouveau tournoi ouvert', message: `Le tournoi "${input.title}" est maintenant ouvert aux inscriptions !`, type: 'system', targetSection: 'tournaments', targetId: id });
    return tournament;
  }
  async register(id: string, teamId: string) {
    if (!teamId?.trim()) throw new BadRequestException('Une équipe doit être sélectionnée.');
    const tournament: any = await this.getById(id);
    if (!tournament) throw new NotFoundException('Tournoi introuvable.');
    if (tournament.registeredTeams >= tournament.maxTeams) throw new ConflictException('Ce tournoi est complet.');
    const team: any = await this.records.find('teams', teamId);
    if (!team) throw new NotFoundException('Équipe introuvable.');
    const participantTeamIds: string[] = tournament.participantTeamIds ?? [];
    if (participantTeamIds.includes(teamId)) throw new ConflictException('Cette équipe participe déjà au tournoi.');
    await this.records.save('tournaments', id, {
      ...tournament,
      participantTeamIds: [...participantTeamIds, teamId],
      registeredTeams: participantTeamIds.length + 1,
    });
    await this.notifications.add({ title: 'Inscription au tournoi', message: `L'équipe ${team.name} est pré-inscrite pour ${tournament.title}.`, type: 'system', targetSection: 'tournaments', targetId: id });
    return true;
  }
}
