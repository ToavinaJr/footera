import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';

@Injectable()
export class TournamentsService {
  constructor(private readonly records: RecordRepository, private readonly notifications: NotificationsService) {}
  list() { return this.records.list('tournaments'); }
  getById(id: string) { return this.records.find('tournaments', id); }
  async create(input: any) {
    const id = `tourn_${randomUUID()}`;
    const tournament = { ...input, id, registeredTeams: 1, status: 'INSCRIPTIONS_OUVERTES', standings: [], fixtures: [] };
    await this.records.create('tournaments', id, tournament);
    await this.notifications.add({ title: 'Nouveau tournoi ouvert', message: `Le tournoi "${input.title}" est maintenant ouvert aux inscriptions !`, type: 'system', targetSection: 'tournaments', targetId: id });
    return tournament;
  }
  async register(id: string, teamName: string) {
    const tournament: any = await this.getById(id);
    if (!tournament) return false;
    await this.records.save('tournaments', id, { ...tournament, registeredTeams: Number(tournament.registeredTeams || 0) + 1 });
    await this.notifications.add({ title: 'Inscription au tournoi', message: `L'équipe ${teamName} est pré-inscrite pour ${tournament.title}.`, type: 'system', targetSection: 'tournaments', targetId: id });
    return true;
  }
}
