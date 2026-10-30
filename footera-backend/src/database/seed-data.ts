import {
  SEED_ACTIVITY_FEED, SEED_APPLICATIONS, SEED_BOOKINGS, SEED_CLUBS, SEED_CLUBS_EXTRA,
  SEED_MARKETPLACE, SEED_MATCHES, SEED_PLAYERS_EXTRA,
  SEED_NOTIFICATIONS, SEED_PITCHES, SEED_PLAYERS, SEED_RECRUITMENT_ADS,
  SEED_TEAMS, SEED_TOURNAMENTS, SEED_USER, SEED_CATALOGS,
} from './seeds.js';
import { PrismaService } from './prisma.service.js';
import { asJson, RECORD_MODELS, RecordCollection, type RecordDelegate } from './record.repository.js';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { MATCH_EVENT_TYPES, MATCH_STATUSES } from '../types/domain.js';
import { normalizeSearchText } from '../utils/text.utils.js';

function derivePasswordKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

function normalizedName(value: unknown): string {
  return normalizeSearchText(value);
}

const seededPlayers = [...SEED_PLAYERS, ...SEED_PLAYERS_EXTRA];
const playerIdsByName = new Map(seededPlayers.map((player) => [normalizedName(player.name), player.id]));
const playersById = new Map(seededPlayers.map((player) => [player.id, player]));
function normalizeSeededMatch(rawMatch: unknown): Record<string, unknown> {
  const match = asObject(rawMatch);
  const events = asObjectArray(match.events).map((event) => {
    const playerId = typeof event.playerId === 'string' && playersById.has(event.playerId)
      ? event.playerId
      : playerIdsByName.get(normalizedName(event.player));
    const assistPlayerId = typeof event.assistPlayerId === 'string' && playersById.has(event.assistPlayerId)
      ? event.assistPlayerId
      : playerIdsByName.get(normalizedName(event.assist));
    const player = playerId ? playersById.get(playerId) : undefined;
    return {
      ...event,
      ...(playerId ? { playerId } : {}),
      ...(player ? { player: player.name } : {}),
      ...(assistPlayerId ? { assistPlayerId } : {}),
    };
  });
  return {
    ...match,
    ...(typeof match.pitchId === 'string' ? {
      venue: SEED_PITCHES.find((pitch) => pitch.id === match.pitchId)?.complexName ?? match.venue,
      pitchName: SEED_PITCHES.find((pitch) => pitch.id === match.pitchId)?.name ?? match.pitchName,
    } : {}),
    events,
  };
}

const seededMatches = SEED_MATCHES.map(normalizeSeededMatch);
const seededActivityFeed = SEED_ACTIVITY_FEED.map((item) => {
  if (item.id === 'act_1') return { ...item, description: 'Betsileo FC mène 2 - 1 face à AS Analakely (but de Faneva Solofo à la 68e).', targetId: 'match_01' };
  if (item.id === 'act_2') return { ...item, description: 'Faneva Solofo fait partie de l’effectif de Betsileo FC au poste d’ailier droit.', targetId: 'team_betsileo' };
  if (item.id === 'act_3') return { ...item, description: 'Réservation validée au Stade Municipal de Fianarantsoa — terrain synthétique 11x11.', targetId: 'pitch_01' };
  return item;
});

function deriveSeedPlayerStats() {
  const totals = new Map(seededPlayers.map((player) => [player.id, { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }]));
  for (const rawMatch of seededMatches) {
    const match = asObject(rawMatch);
    if (match.status !== MATCH_STATUSES.FINISHED) continue;
    const participants = new Set<string>();
    for (const lineup of asObjectArray(match.lineups)) {
      for (const id of Array.isArray(lineup.playerIds) ? lineup.playerIds : []) {
        if (typeof id === 'string' && totals.has(id)) participants.add(id);
      }
    }
    for (const event of asObjectArray(match.events)) {
      const id = typeof event.playerId === 'string' ? event.playerId : undefined;
      const stats = id ? totals.get(id) : undefined;
      if (!stats) continue;
      participants.add(id!);
      if (event.type === MATCH_EVENT_TYPES.GOAL || event.type === MATCH_EVENT_TYPES.PENALTY) stats.goals += 1;
      if (event.type === MATCH_EVENT_TYPES.YELLOW_CARD) stats.yellowCards += 1;
      if (event.type === MATCH_EVENT_TYPES.RED_CARD) stats.redCards += 1;
      const assistId = typeof event.assistPlayerId === 'string' ? event.assistPlayerId : undefined;
      const assistStats = assistId ? totals.get(assistId) : undefined;
      if (assistStats && assistId !== id && (event.type === MATCH_EVENT_TYPES.GOAL || event.type === MATCH_EVENT_TYPES.PENALTY)) {
        assistStats.assists += 1;
        participants.add(assistId!);
      }
    }
    for (const id of participants) {
      const stats = totals.get(id);
      if (stats) stats.appearances += 1;
    }
  }
  return seededPlayers.map((player) => ({ ...player, ...totals.get(player.id) }));
}

const normalizedPlayers = deriveSeedPlayerStats();
const normalizedPlayerById = new Map(normalizedPlayers.map((player) => [player.id, player]));
const normalizedTeams = SEED_TEAMS.map((team) => ({
  ...team,
  members: team.members.map((member) => {
    const stats = normalizedPlayerById.get(member.playerId);
    return stats ? { ...member, appearances: stats.appearances, goals: stats.goals, assists: stats.assists } : member;
  }),
}));
const normalizedClubs = [...SEED_CLUBS, ...SEED_CLUBS_EXTRA].map((club) => ({
  ...club,
  membersTotal: club.teams.reduce((count, teamRef) => count + (normalizedTeams.find((team) => team.id === teamRef.id)?.members.length ?? 0), 0),
}));
const normalizedApplications = SEED_APPLICATIONS.map((application) => ({ ...application }));
const normalizedRecruitmentAds = SEED_RECRUITMENT_ADS.map((ad) => ({
  ...ad,
  candidatesCount: normalizedApplications.filter((application) => application.adId === ad.id).length,
}));
const normalizedMarketplace = SEED_MARKETPLACE.map((item) => ({
  ...item,
  ...(item.id === 'mkt_01' ? { sellerId: 'ply_02', sellerName: normalizedPlayerById.get('ply_02')?.name ?? item.sellerName }
    : item.id === 'mkt_02' ? { sellerId: 'ply_mika', sellerName: normalizedPlayerById.get('ply_mika')?.name ?? item.sellerName } : {}),
}));

export function validateSeedRelations(): void {
  const players = normalizedPlayers;
  const playerById = new Map(players.map((player) => [player.id, player]));
  const teams = new Map(SEED_TEAMS.map((team) => [team.id, team]));
  const clubs = new Map([...SEED_CLUBS, ...SEED_CLUBS_EXTRA].map((club) => [club.id, club]));
  const tournaments = new Map(SEED_TOURNAMENTS.map((tournament) => [tournament.id, tournament]));
  const pitches = new Map(SEED_PITCHES.map((pitch) => [pitch.id, pitch]));
  const users = new Set([SEED_USER.id]);
  const fail = (relation: string, id: string): never => { throw new Error(`Invalid seed relation ${relation}: ${id}`); };

  for (const player of players) {
    if (player.currentTeamId && !teams.has(player.currentTeamId)) fail('player.currentTeamId', player.id);
    if (player.userId && !users.has(player.userId)) fail('player.userId', player.id);
  }
  for (const team of SEED_TEAMS) {
    if (team.membersCount !== team.members.length) fail('team.membersCount', team.id);
    if (team.clubId && !clubs.has(team.clubId)) fail('team.clubId', team.id);
    for (const member of team.members) if (!playerById.has(member.playerId)) fail('team.member.playerId', `${team.id}/${member.playerId}`);
  }
  for (const club of [...SEED_CLUBS, ...SEED_CLUBS_EXTRA]) {
    if (club.teamsCount !== club.teams.length) fail('club.teamsCount', club.id);
    for (const team of club.teams) if (!teams.has(team.id)) fail('club.team.id', `${club.id}/${team.id}`);
    for (const team of club.teams) if (teams.get(team.id)?.clubId !== club.id) fail('club.team.clubId', `${club.id}/${team.id}`);
  }
  for (const tournament of SEED_TOURNAMENTS) {
    if (tournament.registeredTeams !== tournament.participantTeamIds.length) fail('tournament.registeredTeams', tournament.id);
    for (const teamId of tournament.participantTeamIds) if (!teams.has(teamId)) fail('tournament.participantTeamIds', `${tournament.id}/${teamId}`);
  }
  for (const rawMatch of seededMatches) {
    const match = asObject(rawMatch);
    const matchId = String(match.id);
    const home = asObject(match.homeTeam);
    const away = asObject(match.awayTeam);
    if (!teams.has(String(home.id)) || !teams.has(String(away.id)) || home.id === away.id) fail('match.teams', matchId);
    if (typeof match.tournamentId === 'string') {
      const tournament = tournaments.get(match.tournamentId);
      if (!tournament || !tournament.participantTeamIds.includes(String(home.id)) || !tournament.participantTeamIds.includes(String(away.id))) fail('match.tournamentId', matchId);
    }
    if (typeof match.pitchId === 'string' && !pitches.has(match.pitchId)) fail('match.pitchId', matchId);
    if (typeof match.pitchId === 'string') {
      const pitch = pitches.get(match.pitchId);
      if (!pitch) throw new Error(`Invalid seed relation match.pitchId: ${matchId}`);
      if (match.venue !== pitch.complexName || match.pitchName !== pitch.name) fail('match.pitchDetails', matchId);
    }
    const goalCounts = new Map([[String(home.id), 0], [String(away.id), 0]]);
    for (const event of asObjectArray(match.events)) {
      const teamId = String(event.teamId);
      if (!goalCounts.has(teamId)) fail('match.event.teamId', matchId);
      const playerId = typeof event.playerId === 'string' ? event.playerId : undefined;
      const player = playerId ? playerById.get(playerId) : undefined;
      if (!player || player.currentTeamId !== teamId) fail('match.event.playerId', `${matchId}/${playerId ?? String(event.player)}`);
      if (event.type === MATCH_EVENT_TYPES.GOAL || event.type === MATCH_EVENT_TYPES.PENALTY) goalCounts.set(teamId, (goalCounts.get(teamId) ?? 0) + 1);
      const assistId = typeof event.assistPlayerId === 'string' ? event.assistPlayerId : undefined;
      if (assistId && playerById.get(assistId)?.currentTeamId !== teamId) fail('match.event.assistPlayerId', `${matchId}/${assistId}`);
    }
    if (match.status === MATCH_STATUSES.FINISHED || match.status === MATCH_STATUSES.LIVE) {
      if (goalCounts.get(String(home.id)) !== home.score || goalCounts.get(String(away.id)) !== away.score) fail('match.score/events', matchId);
    }
    for (const lineup of asObjectArray(match.lineups)) {
      const teamId = String(lineup.teamId);
      if (teamId !== home.id && teamId !== away.id) fail('match.lineup.teamId', matchId);
      for (const playerId of Array.isArray(lineup.playerIds) ? lineup.playerIds : []) {
        if (typeof playerId !== 'string' || playerById.get(playerId)?.currentTeamId !== teamId) fail('match.lineup.playerIds', `${matchId}/${String(playerId)}`);
      }
    }
  }
  const bookingSlots = new Set<string>();
  for (const booking of SEED_BOOKINGS) {
    const pitch = pitches.get(booking.pitchId);
    if (!users.has(booking.userId)) fail('booking.userId', booking.id);
    if (!pitch) throw new Error(`Invalid seed relation booking.pitchId: ${booking.id}`);
    const slot = pitch.availableSlots.find((candidate) => candidate.time === booking.time);
    if (!slot?.isAvailable) fail('booking.slot', booking.id);
    if (booking.pitchName !== pitch.name || booking.complexName !== pitch.complexName || booking.surface !== pitch.surface) fail('booking.pitchDetails', booking.id);
    if (!teams.has(SEED_TEAMS.find((team) => team.name === booking.teamName)?.id ?? '')) fail('booking.teamName', booking.id);
    const key = `${booking.pitchId}:${booking.date}:${booking.time}`;
    if (bookingSlots.has(key)) fail('booking.duplicateSlot', booking.id);
    bookingSlots.add(key);
  }
  for (const application of SEED_APPLICATIONS) {
    if (!users.has(application.userId) || !SEED_RECRUITMENT_ADS.some((ad) => ad.id === application.adId)) fail('application.userId/adId', application.id);
  }
  for (const ad of SEED_RECRUITMENT_ADS) if (!teams.has(ad.teamId)) fail('recruitmentAd.teamId', ad.id);
  for (const item of normalizedMarketplace) if (item.sellerId && !playerById.has(item.sellerId)) fail('marketplace.sellerId', item.id);
  for (const notification of SEED_NOTIFICATIONS) if (!users.has(notification.recipientId)) fail('notification.recipientId', notification.id);
  for (const activity of SEED_ACTIVITY_FEED) {
    const section = activity.targetSection;
    const targetId = activity.targetId;
    if (typeof targetId !== 'string') continue;
    const exists = section === 'matches' ? seededMatches.some((match) => asObject(match).id === targetId)
      : section === 'teams' ? teams.has(targetId)
        : section === 'pitches' ? pitches.has(targetId) : true;
    if (!exists) fail('activity.targetId', activity.id);
  }
}

const collections: Array<[RecordCollection, string, unknown[]]> = [
  ['users', 'id', [SEED_USER]],
  ['players', 'id', normalizedPlayers],
  ['teams', 'id', normalizedTeams],
  ['clubs', 'id', normalizedClubs],
  ['matches', 'id', seededMatches],
  ['tournaments', 'id', SEED_TOURNAMENTS],
  ['pitches', 'id', SEED_PITCHES],
  ['bookings', 'id', SEED_BOOKINGS],
  ['recruitmentAds', 'id', normalizedRecruitmentAds],
  ['applications', 'id', normalizedApplications],
  ['marketplace', 'id', normalizedMarketplace],
  ['notifications', 'id', SEED_NOTIFICATIONS],
  ['activity', 'id', seededActivityFeed],
  ['catalogs', 'id', SEED_CATALOGS],
];

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map(asObject) : [];
}

function delegateFor(prisma: PrismaService, collection: RecordCollection): RecordDelegate {
  return (prisma as unknown as Record<string, RecordDelegate>)[RECORD_MODELS[collection]];
}

export async function seedDatabase(prisma: PrismaService, { reset = false } = {}) {
  validateSeedRelations();
  if (reset) {
    for (const collection of Object.keys(RECORD_MODELS) as RecordCollection[]) {
      await delegateFor(prisma, collection).deleteMany();
    }
  }

  for (const [collection, key, records] of collections) {
    const delegate = delegateFor(prisma, collection);
    for (const [index, rawPayload] of records.entries()) {
      const payload = asObject(rawPayload);
      const id = String(payload[key] ?? `${collection}_${index + 1}`);
      const existing = await delegate.findUnique({ where: { id } });
      if (existing) {
        const current = asObject(existing.payload);
        if (collection === 'notifications' && !current.createdAt) {
          await delegate.update({ where: { id }, data: { payload: { ...current, createdAt: new Date().toISOString() } } });
        }
        if (collection === 'players') {
          const synchronized = { ...current };
          for (const field of ['userId', 'appearances', 'goals', 'assists', 'yellowCards', 'redCards'] as const) {
            if (payload[field] !== undefined) synchronized[field] = payload[field];
          }
          await delegate.update({ where: { id }, data: { payload: asJson(synchronized) } });
        }
        if (collection === 'teams') {
          const synchronized = {
            ...current,
            ...(payload.ownerId ? { ownerId: payload.ownerId } : {}),
            ...(payload.competitionId ? { competitionId: payload.competitionId } : {}),
            ...(payload.clubId ? { clubId: payload.clubId } : {}),
            ...(Array.isArray(payload.members) ? { members: payload.members, membersCount: payload.membersCount } : {}),
          };
          await delegate.update({ where: { id }, data: { payload: asJson(synchronized) } });
        }
        if (collection === 'pitches' && payload.ownerId) {
          await delegate.update({ where: { id }, data: { payload: asJson({ ...current, ownerId: payload.ownerId }) } });
        }
        if (collection === 'clubs' && Array.isArray(payload.teams)) {
          await delegate.update({ where: { id }, data: { payload: asJson({
            ...current,
            teams: payload.teams,
            teamsCount: payload.teamsCount,
            membersTotal: payload.membersTotal,
          }) } });
        }
        if (collection === 'tournaments' && Array.isArray(payload.participantTeamIds)) {
          await delegate.update({ where: { id }, data: { payload: asJson({
            ...current,
            participantTeamIds: payload.participantTeamIds,
            registeredTeams: payload.registeredTeams,
          }) } });
        }
        if (collection === 'matches') {
          await delegate.update({ where: { id }, data: { payload: asJson({
            ...current,
            homeTeam: payload.homeTeam,
            awayTeam: payload.awayTeam,
            status: payload.status,
            ...(payload.tournamentId ? { tournamentId: payload.tournamentId } : {}),
            ...(payload.pitchId ? { pitchId: payload.pitchId } : {}),
            ...(payload.venue ? { venue: payload.venue } : {}),
            ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
            date: payload.date,
            time: payload.time,
            competition: payload.competition,
            events: payload.events,
            lineups: payload.lineups,
          }) } });
        }
        if (collection === 'activity') {
          await delegate.update({ where: { id }, data: { payload: asJson({ ...current, ...payload }) } });
        }
        if (collection === 'recruitmentAds') {
          await delegate.update({ where: { id }, data: { payload: asJson({ ...current, candidatesCount: payload.candidatesCount, teamId: payload.teamId }) } });
        }
        if (collection === 'marketplace' && payload.sellerId) {
          await delegate.update({ where: { id }, data: { payload: asJson({ ...current, sellerId: payload.sellerId, sellerName: payload.sellerName }) } });
        }
        continue;
      }
      const seedPayload = collection === 'notifications' && !payload.createdAt
        ? { ...payload, createdAt: new Date().toISOString() }
        : payload;
      await delegate.create({ data: { id, payload: asJson(seedPayload) } });
    }
  }

  const notificationDelegate = delegateFor(prisma, 'notifications');
  const legacyNotifications = await notificationDelegate.findMany();
  for (const record of legacyNotifications) {
    const payload = asObject(record.payload);
    if (payload.recipientId) continue;
    await notificationDelegate.update({
      where: { id: record.id },
      data: { payload: asJson({ ...payload, recipientId: SEED_USER.id }) },
    });
  }

  const seedPassword = process.env.SEED_USER_PASSWORD;
  const credentials = delegateFor(prisma, 'authCredentials');
  if (seedPassword && !await credentials.findUnique({ where: { id: SEED_USER.email.toLowerCase() } })) {
    if (seedPassword.length < 12) throw new Error('SEED_USER_PASSWORD must contain at least 12 characters.');
    const salt = randomBytes(16);
    const hash = await derivePasswordKey(seedPassword, salt);
    const passwordHash = `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`;
    await credentials.create({
      data: { id: SEED_USER.email.toLowerCase(), payload: { userId: SEED_USER.id, passwordHash } },
    });
  }
}
