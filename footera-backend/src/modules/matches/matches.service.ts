import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { buildTournamentStandings } from '../tournaments/tournament-standings.js';
import { UserContext } from '../auth/user-context.js';
import type { MatchEventRecord, MatchRecord, PlayerRecord, TeamRecord, TournamentRecord, UpdateMatchInput } from '../../types/records.js';

@Injectable()
export class MatchesService {
  constructor(
    private readonly records: RecordRepository,
    private readonly accounts: AccountsService,
    private readonly userContext: UserContext,
  ) {}
  async list(status?: string) {
    const matches = await this.records.list<MatchRecord>('matches');
    const filteredMatches = status && status !== 'ALL' ? matches.filter((match) => match.status === status) : matches;
    return this.ensureEventPlayerProfiles(filteredMatches);
  }
  async getById(id: string) {
    const match = await this.records.find<MatchRecord>('matches', id);
    if (!match) return null;
    return (await this.ensureEventPlayerProfiles([match]))[0] ?? null;
  }

  private async ensureEventPlayerProfiles(matches: MatchRecord[]) {
    const [players, teams] = await Promise.all([
      this.records.list<PlayerRecord>('players'),
      this.records.list<TeamRecord>('teams'),
    ]);
    const playersById = new Map(players.map((player) => [player.id, player]));
    const resolvedByTeamAndName = new Map<string, PlayerRecord>();
    const normalizeName = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const resolvePlayer = async (id: string | undefined, name: string | undefined, teamId: string): Promise<PlayerRecord | undefined> => {
      const existingById = id ? playersById.get(id) : undefined;
      if (existingById) return existingById;
      if (!name?.trim()) return undefined;

      const normalized = normalizeName(name);
      const cacheKey = `${teamId}:${normalized}`;
      const cached = resolvedByTeamAndName.get(cacheKey);
      if (cached) return cached;

      const team = teams.find((candidate) => candidate.id === teamId);
      const rosterIds = new Set((team?.members ?? []).map((member) => member.playerId));
      const existingByName = players.find((player) => normalizeName(player.name) === normalized
        && (player.currentTeamId === teamId || rosterIds.has(player.id) || (player.userId ? rosterIds.has(player.userId) : false)));
      if (existingByName) {
        resolvedByTeamAndName.set(cacheKey, existingByName);
        return existingByName;
      }

      const profileId = `match_player_${createHash('sha256').update(cacheKey).digest('hex').slice(0, 24)}`;
      const persistedProfile = await this.records.find<PlayerRecord>('players', profileId);
      const profile = persistedProfile ?? {
        id: profileId,
        name: name.trim(),
        currentTeamId: teamId,
        currentTeam: team?.name,
        city: team?.city,
        primaryPosition: 'Joueur',
      };
      if (!persistedProfile) await this.records.save('players', profileId, profile);
      playersById.set(profile.id, profile);
      players.push(profile);
      resolvedByTeamAndName.set(cacheKey, profile);
      return profile;
    };

    const enrichedMatches: MatchRecord[] = [];
    for (const match of matches) {
      let changed = false;
      const events: MatchEventRecord[] = [];
      for (const event of match.events ?? []) {
        const player = await resolvePlayer(event.playerId, event.player, event.teamId);
        const assister = event.assist || event.assistPlayerId
          ? await resolvePlayer(event.assistPlayerId, event.assist, event.teamId)
          : undefined;
        const enrichedEvent = {
          ...event,
          ...(player ? { playerId: player.id, player: player.name } : {}),
          ...(assister ? { assistPlayerId: assister.id, assist: assister.name } : {}),
        };
        if (enrichedEvent.playerId !== event.playerId || enrichedEvent.player !== event.player
          || enrichedEvent.assistPlayerId !== event.assistPlayerId || enrichedEvent.assist !== event.assist) changed = true;
        events.push(enrichedEvent);
      }
      const enrichedMatch = { ...match, events };
      if (changed) await this.records.save('matches', match.id, enrichedMatch);
      enrichedMatches.push(enrichedMatch);
    }
    return enrichedMatches;
  }

  async standings(tournamentId?: string) {
    const [tournaments, teams, matches] = await Promise.all([
      this.records.list<TournamentRecord>('tournaments'), this.records.list<TeamRecord>('teams'), this.records.list<MatchRecord>('matches'),
    ]);
    const tournament = tournamentId
      ? tournaments.find((item) => item.id === tournamentId)
      : tournaments.find((item) => item.id === 'championnat_r2_2026') ?? tournaments[0];
    if (!tournament) return [];
    return buildTournamentStandings(tournament, teams, matches);
  }

  async manageableMatchIds() {
    const userId = this.userContext.userId;
    if (!userId) throw new UnauthorizedException('Authentification requise.');
    const [matches, tournaments] = await Promise.all([
      this.records.list<MatchRecord>('matches'),
      this.records.list<TournamentRecord>('tournaments'),
    ]);
    const managedTournamentIds = new Set(tournaments.filter((tournament) => tournament.organizerId === userId).map((tournament) => tournament.id));
    return matches.filter((match) => match.tournamentId && managedTournamentIds.has(match.tournamentId)
      && match.status !== 'FINISHED').map((match) => match.id);
  }

  async update(id: string, input: UpdateMatchInput) {
    const match = await this.getEditableMatch(id);
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('Les modifications du match sont invalides.');
    }
    const allowedFields = new Set(['date', 'time', 'scheduledAt', 'venue', 'pitchId', 'city', 'events']);
    if (!Object.keys(input).length || Object.keys(input).some((field) => !allowedFields.has(field))) {
      throw new BadRequestException('Le formulaire contient des champs non autorisés ou aucune modification.');
    }
    const nextMatch: MatchRecord = { ...match };
    for (const field of ['date', 'time', 'scheduledAt', 'venue', 'pitchId', 'city'] as const) {
      const value = input[field];
      if (value === undefined) continue;
      if (typeof value !== 'string' || value.trim().length === 0 || value.length > (field === 'venue' ? 200 : 100)) {
        throw new BadRequestException(`La valeur du champ ${field} est invalide.`);
      }
      if (field === 'scheduledAt' && Number.isNaN(Date.parse(value))) {
        throw new BadRequestException('La date planifiée est invalide.');
      }
      nextMatch[field] = value.trim();
    }
    if (input.date !== undefined || input.time !== undefined) {
      const matchDate = input.date?.trim() ?? match.date ?? '';
      const matchTime = input.time?.trim() ?? match.time ?? '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(matchDate) && /^\d{2}:\d{2}$/.test(matchTime)) {
        nextMatch.scheduledAt = `${matchDate}T${matchTime}:00.000Z`;
      }
    }
    if (input.events !== undefined) {
      const events = await this.validateMatchEvents(input.events, match);
      nextMatch.events = events;
      nextMatch.homeTeam = {
        ...match.homeTeam,
        score: events.filter((event) => event.teamId === match.homeTeam.id && ['goal', 'penalty'].includes(event.type)).length,
      };
      nextMatch.awayTeam = {
        ...match.awayTeam,
        score: events.filter((event) => event.teamId === match.awayTeam.id && ['goal', 'penalty'].includes(event.type)).length,
      };
    }
    const saved = await this.records.save('matches', id, nextMatch);
    return (await this.ensureEventPlayerProfiles([saved]))[0] ?? saved;
  }

  async start(id: string) {
    const match = await this.getEditableMatch(id);
    if (match.status !== 'SCHEDULED') throw new ConflictException('Seul un match planifié peut être lancé.');
    return this.records.save('matches', id, {
      ...match,
      status: 'LIVE',
      minute: 0,
      playedAt: new Date().toISOString(),
    });
  }

  async finish(id: string) {
    const match = await this.getEditableMatch(id);
    if (match.status !== 'LIVE') throw new ConflictException('Seul un match en direct peut être terminé.');
    return this.records.save('matches', id, {
      ...match,
      status: 'FINISHED',
      minute: Math.max(match.minute ?? 0, 90),
      playedAt: new Date().toISOString(),
    });
  }

  private async getEditableMatch(id: string) {
    const match = await this.records.find<MatchRecord>('matches', id);
    if (!match) throw new NotFoundException('Match introuvable.');
    if (match.status === 'FINISHED') throw new ConflictException('Un match terminé ne peut plus être modifié.');
    const userId = this.userContext.userId;
    if (!userId) throw new UnauthorizedException('Authentification requise.');
    if (!match.tournamentId) throw new ForbiddenException('Ce match n’est associé à aucun tournoi.');
    const tournament = await this.records.find<TournamentRecord>('tournaments', match.tournamentId);
    if (!tournament) throw new NotFoundException('Tournoi introuvable.');
    if (tournament.organizerId !== userId) throw new ForbiddenException('Seul l’organisateur de ce tournoi peut gérer le match.');
    return match;
  }

  private async validateMatchEvents(events: MatchEventRecord[], match: MatchRecord) {
    if (!Array.isArray(events) || events.length > 100) throw new BadRequestException('La liste des événements est invalide.');
    const allowedTypes = new Set(['goal', 'penalty', 'yellow_card', 'red_card', 'sub']);
    const [players, teams] = await Promise.all([
      this.records.list<PlayerRecord>('players'),
      this.records.list<TeamRecord>('teams'),
    ]);
    const teamIds = new Set([match.homeTeam.id, match.awayTeam.id]);
    return events.map((event) => {
      if (!event || !Number.isInteger(event.minute) || event.minute < 0 || event.minute > 130
        || !allowedTypes.has(event.type) || !teamIds.has(event.teamId)) {
        throw new BadRequestException('Un événement du match contient des informations invalides.');
      }
      const team = teams.find((candidate) => candidate.id === event.teamId);
      const rosterPlayerIds = new Set((team?.members ?? []).map((member) => member.playerId));
      const player = players.find((candidate) => candidate.id === event.playerId
        && (candidate.currentTeamId === event.teamId || rosterPlayerIds.has(candidate.id)
          || (candidate.userId ? rosterPlayerIds.has(candidate.userId) : false)));
      if (!player) throw new BadRequestException('Le joueur sélectionné ne fait pas partie de cette équipe.');
      const assist = event.assistPlayerId
        ? players.find((candidate) => candidate.id === event.assistPlayerId
          && (candidate.currentTeamId === event.teamId || rosterPlayerIds.has(candidate.id)
            || (candidate.userId ? rosterPlayerIds.has(candidate.userId) : false)))
        : undefined;
      if (event.assistPlayerId && (!assist || !['goal', 'penalty'].includes(event.type) || assist.id === player.id)) {
        throw new BadRequestException('La passe décisive sélectionnée est invalide.');
      }
      return {
        minute: event.minute,
        type: event.type,
        teamId: event.teamId,
        playerId: player.id,
        player: player.name,
        ...(assist ? { assistPlayerId: assist.id, assist: assist.name } : {}),
        ...(typeof event.description === 'string' && event.description.trim()
          ? { description: event.description.trim().slice(0, 300) } : {}),
      };
    }).sort((left, right) => left.minute - right.minute);
  }

  activityFeed() { return this.records.list('activity'); }
  async toggleFavorite(id: string) {
    const match = await this.records.find<MatchRecord>('matches', id);
    if (!match) throw new NotFoundException('Match introuvable.');

    const profile = await this.accounts.profile();
    const isAlreadyFollowed = profile?.favoriteMatchIds?.includes(id) ?? false;
    if (match.status === 'FINISHED' && !isAlreadyFollowed) {
      throw new ConflictException('Un match terminé ne peut plus être suivi.');
    }

    return this.accounts.toggleFavoriteMatch(id);
  }
}
