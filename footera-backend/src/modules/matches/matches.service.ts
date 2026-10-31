import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { buildTournamentStandings } from '../tournaments/tournament-standings.js';
import { UserContext } from '../auth/user-context.js';
import { MATCH_EVENT_TYPES, MATCH_STATUSES, type MatchEventType } from '../../types/domain.js';
import { isIntegerInRange } from '../../utils/number.utils.js';
import { sanitizePlainText } from '../../utils/sanitize.utils.js';
import type { MatchEventRecord, MatchRecord, PlayerRecord, TeamRecord, TournamentRecord, UpdateMatchInput } from '../../types/records.js';

const SCORING_EVENT_TYPES = new Set<MatchEventType>([MATCH_EVENT_TYPES.GOAL, MATCH_EVENT_TYPES.PENALTY]);
const isScoringEvent = (type: MatchEventType) => SCORING_EVENT_TYPES.has(type);
const MATCH_EVENT_INPUT_FIELDS = new Set([
  'minute', 'type', 'teamId', 'playerId', 'assistPlayerId', 'substitutedPlayerId', 'description',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

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
      && match.status !== MATCH_STATUSES.FINISHED).map((match) => match.id);
  }

  async update(id: string, input: UpdateMatchInput) {
    const match = await this.getEditableMatch(id);
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('Les modifications du match sont invalides.');
    }
    const allowedFields = new Set(['date', 'time', 'scheduledAt', 'venue', 'pitchId', 'city', 'events', 'lineups']);
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
      nextMatch[field] = sanitizePlainText(value, field === 'venue' ? 200 : 100);
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
        score: events.filter((event) => event.teamId === match.homeTeam.id && isScoringEvent(event.type)).length,
      };
      nextMatch.awayTeam = {
        ...match.awayTeam,
        score: events.filter((event) => event.teamId === match.awayTeam.id && isScoringEvent(event.type)).length,
      };
    }
    if (input.lineups !== undefined) nextMatch.lineups = await this.validateMatchLineups(input.lineups, match);
    const saved = await this.records.save('matches', id, nextMatch);
    if (input.events !== undefined) await this.records.publishActivity?.('matches', id, `${match.homeTeam.name} — ${match.awayTeam.name}`, `${nextMatch.homeTeam.score} - ${nextMatch.awayTeam.score}`);
    return (await this.ensureEventPlayerProfiles([saved]))[0] ?? saved;
  }

  async start(id: string) {
    const match = await this.getEditableMatch(id);
    if (match.status !== MATCH_STATUSES.SCHEDULED) throw new ConflictException('Seul un match planifié peut être lancé.');
    const updated = await this.records.save('matches', id, {
      ...match,
      status: MATCH_STATUSES.LIVE,
      minute: 0,
      playedAt: new Date().toISOString(),
    });
    await this.records.publishActivity?.('matches', id, `${match.homeTeam.name} — ${match.awayTeam.name}`, 'LIVE');
    return updated;
  }

  async finish(id: string) {
    const match = await this.getEditableMatch(id);
    if (match.status !== MATCH_STATUSES.LIVE) throw new ConflictException('Seul un match en direct peut être terminé.');
    const updated = await this.records.save('matches', id, {
      ...match,
      status: MATCH_STATUSES.FINISHED,
      minute: Math.max(match.minute ?? 0, 90),
      playedAt: new Date().toISOString(),
    });
    await this.records.publishActivity?.('matches', id, `${match.homeTeam.name} — ${match.awayTeam.name}`, `${match.homeTeam.score} - ${match.awayTeam.score} · FINISHED`);
    return updated;
  }

  private async getEditableMatch(id: string) {
    const match = await this.records.find<MatchRecord>('matches', id);
    if (!match) throw new NotFoundException('Match introuvable.');
    if (match.status === MATCH_STATUSES.FINISHED) throw new ConflictException('Un match terminé ne peut plus être modifié.');
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
    const allowedTypes = new Set<MatchEventType>(Object.values(MATCH_EVENT_TYPES));
    const [players, teams] = await Promise.all([
      this.records.list<PlayerRecord>('players'),
      this.records.list<TeamRecord>('teams'),
    ]);
    const teamIds = new Set([match.homeTeam.id, match.awayTeam.id]);
    return events.map((event) => {
      if (!isPlainObject(event) || Object.keys(event).some((field) => !MATCH_EVENT_INPUT_FIELDS.has(field))
        || !isIntegerInRange(event.minute, 0, 130)
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
      if (event.assistPlayerId && (!assist || !isScoringEvent(event.type) || assist.id === player.id)) {
        throw new BadRequestException('La passe décisive sélectionnée est invalide.');
      }
      const substitutedPlayer = event.substitutedPlayerId
        ? players.find((candidate) => candidate.id === event.substitutedPlayerId
          && (candidate.currentTeamId === event.teamId || rosterPlayerIds.has(candidate.id)
            || (candidate.userId ? rosterPlayerIds.has(candidate.userId) : false)))
        : undefined;
      if (event.substitutedPlayerId && (!substitutedPlayer || event.type !== MATCH_EVENT_TYPES.SUBSTITUTION || substitutedPlayer.id === player.id)) {
        throw new BadRequestException('Le joueur remplacé est invalide.');
      }
      if (event.type === MATCH_EVENT_TYPES.SUBSTITUTION && !substitutedPlayer) {
        throw new BadRequestException('Une substitution doit identifier le joueur remplacé.');
      }
      return {
        minute: event.minute,
        type: event.type,
        teamId: event.teamId,
        playerId: player.id,
        player: player.name,
        ...(assist ? { assistPlayerId: assist.id, assist: assist.name } : {}),
        ...(substitutedPlayer ? { substitutedPlayerId: substitutedPlayer.id } : {}),
        ...(typeof event.description === 'string' && sanitizePlainText(event.description, 300)
          ? { description: sanitizePlainText(event.description, 300) } : {}),
      };
    }).sort((left, right) => left.minute - right.minute);
  }

  private async validateMatchLineups(lineups: NonNullable<UpdateMatchInput['lineups']>, match: MatchRecord) {
    if (!Array.isArray(lineups) || lineups.length > 2) throw new BadRequestException('Les compositions du match sont invalides.');
    const teamIds = new Set([match.homeTeam.id, match.awayTeam.id]);
    const seenTeams = new Set<string>();
    const seenPlayers = new Set<string>();
    const [players, teams] = await Promise.all([
      this.records.list<PlayerRecord>('players'),
      this.records.list<TeamRecord>('teams'),
    ]);
    return lineups.map((lineup) => {
      if (!isPlainObject(lineup) || Object.keys(lineup).some((field) => field !== 'teamId' && field !== 'playerIds')
        || !teamIds.has(lineup.teamId) || seenTeams.has(lineup.teamId)
        || !Array.isArray(lineup.playerIds) || lineup.playerIds.length > 30
        || new Set(lineup.playerIds).size !== lineup.playerIds.length) {
        throw new BadRequestException('Une composition contient des données invalides ou dupliquées.');
      }
      seenTeams.add(lineup.teamId);
      const team = teams.find((candidate) => candidate.id === lineup.teamId);
      for (const playerId of lineup.playerIds) {
        const player = players.find((candidate) => candidate.id === playerId);
        const rosterHasPlayer = team?.members?.some((member) => member.playerId === playerId || member.playerId === player?.userId) ?? false;
        if (!player || (player.currentTeamId !== lineup.teamId && !rosterHasPlayer) || seenPlayers.has(playerId)) {
          throw new BadRequestException('Un joueur de la composition ne fait pas partie de cette équipe ou est dupliqué.');
        }
        seenPlayers.add(playerId);
      }
      return { teamId: lineup.teamId, playerIds: [...lineup.playerIds] };
    });
  }

  activityFeed() { return this.records.list('activity'); }
  async toggleFavorite(id: string) {
    const match = await this.records.find<MatchRecord>('matches', id);
    if (!match) throw new NotFoundException('Match introuvable.');

    const profile = await this.accounts.profile();
    const isAlreadyFollowed = profile?.favoriteMatchIds?.includes(id) ?? false;
    if (match.status === MATCH_STATUSES.FINISHED && !isAlreadyFollowed) {
      throw new ConflictException('Un match terminé ne peut plus être suivi.');
    }

    return this.accounts.toggleFavoriteMatch(id);
  }
}
