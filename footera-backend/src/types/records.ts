import type { AppSection, ApplicationStatus, BookingStatus, MatchEventType, MatchStatus, NotificationType, RequestableRole, RoleRequestStatus, TeamInvitationStatus, TeamJoinRequestStatus, TournamentStatus } from './domain.js';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  avatarUrl?: string;
  activeRole?: string;
  roles?: string[];
  favoriteTeamIds?: string[];
  favoriteMatchIds?: string[];
  favoritePlayerIds?: string[];
  favoriteTournamentIds?: string[];
  preferences?: { language?: 'fr' | 'en' | 'mg'; showPersonalActivity?: boolean };
  dateOfBirth?: string;
  age?: number;
  sportsCv?: SportsCvRecord;
  [key: string]: unknown;
}

export interface AuthCredentialRecord { userId: string; passwordHash: string }
export interface AuthSessionRecord { userId: string; expiresAt: string }
export interface RoleRequestRecord {
  id: string;
  userId: string;
  role: RequestableRole;
  status: RoleRequestStatus;
  reason?: string;
  createdAt: string;
}

export interface SportsCvRecord {
  primaryPosition?: string;
  secondaryPosition?: string;
  strongFoot?: string;
  height?: number;
  weight?: number;
  experienceYears?: number;
  preferredNumber?: number;
  currentTeam?: string;
  bio?: string;
  [key: string]: unknown;
}

export interface PlayerRecord {
  id: string;
  userId?: string;
  galleryImages?: string[];
  name: string;
  age?: number;
  city?: string;
  avatarUrl?: string;
  primaryPosition?: string;
  secondaryPosition?: string;
  strongFoot?: string;
  currentTeam?: string;
  currentTeamId?: string;
  level?: string;
  height?: number;
  weight?: number;
  appearances?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  minutesPlayed?: number | null;
  teamHistoryStats?: Array<{
    teamId?: string;
    teamName: string;
    appearances: number;
    minutesPlayed?: number | null;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  }>;
  experienceYears?: number;
  isAvailableForTransfer?: boolean;
  rating?: number;
  bio?: string;
  previousClubs?: string[];
  [key: string]: unknown;
}

export interface TeamMemberRecord {
  playerId: string;
  name: string;
  position?: string;
  jerseyNumber?: number;
  role?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

export interface TeamRecord {
  id: string;
  name: string;
  shortName?: string;
  city?: string;
  logoUrl?: string;
  division?: string;
  category?: string;
  clubName?: string;
  competitionId?: string;
  coachName?: string;
  ownerId?: string;
  managerIds?: string[];
  members?: TeamMemberRecord[];
  membersCount?: number;
  [key: string]: unknown;
}

export interface MatchEventRecord {
  minute: number;
  type: MatchEventType;
  teamId: string;
  playerId?: string;
  player: string;
  assistPlayerId?: string;
  /** Player leaving the pitch; playerId identifies the player entering on substitutions. */
  substitutedPlayerId?: string;
  assist?: string;
  description?: string;
}

export interface MatchRecord {
  id: string;
  tournamentId?: string;
  status: MatchStatus;
  playedAt?: string;
  scheduledAt?: string;
  date?: string;
  time?: string;
  minute?: number;
  venue?: string;
  pitchId?: string;
  pitchName?: string;
  city?: string;
  competition?: string;
  homeTeam: { id: string; name?: string; score: number; [key: string]: unknown };
  awayTeam: { id: string; name?: string; score: number; [key: string]: unknown };
  events?: MatchEventRecord[];
  lineups?: Array<{ teamId: string; playerIds: string[] }>;
  [key: string]: unknown;
}

export interface UpdateMatchInput {
  date?: string;
  time?: string;
  scheduledAt?: string;
  venue?: string;
  pitchId?: string;
  city?: string;
  events?: MatchEventRecord[];
  lineups?: Array<{ teamId: string; playerIds: string[] }>;
}

export interface PitchRecord {
  id: string;
  ownerId?: string;
  galleryImages?: string[];
  name: string;
  complexName: string;
  city: string;
  address?: string;
  surface: string;
  dimensions?: string;
  imageUrl?: string;
  hourlyRate?: number;
  rating?: number;
  reviewsCount?: number;
  reviews?: PitchReviewRecord[];
  myReview?: PitchReviewRecord;
  myRating?: number;
  amenities?: string[];
  availableSlots: PitchSlotRecord[];
  [key: string]: unknown;
}

export interface PitchSlotRecord {
  id: string;
  time: string;
  price: number;
  isAvailable: boolean;
}

export interface PitchReviewRecord {
  userId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface BookingRecord {
  id: string;
  userId: string;
  pitchId: string;
  pitchName: string;
  complexName: string;
  surface: string;
  date: string;
  time: string;
  durationMinutes: number;
  totalPrice: number;
  bookerName: string;
  bookerPhone: string;
  teamName: string;
  status: BookingStatus;
  createdAt: string;
  [key: string]: unknown;
}

export interface TournamentRecord {
  id: string;
  organizerId?: string;
  pitchIds?: string[];
  galleryImages?: string[];
  title?: string;
  status?: TournamentStatus;
  city?: string;
  venue?: string;
  startDate?: string;
  maxTeams?: number;
  participantTeamIds?: string[];
  [key: string]: unknown;
}

export interface TeamInvitationRecord {
  id: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  senderId: string;
  senderName: string;
  message: string;
  status: TeamInvitationStatus;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface TeamJoinRequestRecord {
  id: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  userId: string;
  message: string;
  status: TeamJoinRequestStatus;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetSection: AppSection;
  targetId?: string;
  recipientId: string;
  invitationId?: string;
  invitationStatus?: TeamInvitationStatus;
  time?: string;
  createdAt: string;
  isRead: boolean;
  [key: string]: unknown;
}

export interface ClubRecord {
  id: string;
  name: string;
  logoUrl: string;
  galleryImages?: string[];
  teams?: Array<{ id: string; name?: string; category?: string }>;
  [key: string]: unknown;
}

export interface RecruitmentAdRecord {
  id: string;
  teamName: string;
  city: string;
  description: string;
  positionSought: string;
  division: string;
  candidatesCount?: number;
  [key: string]: unknown;
}

export interface ApplicationRecord {
  id: string;
  userId: string;
  adId: string;
  submittedAt: string;
  status: ApplicationStatus;
  [key: string]: unknown;
}

export interface MarketplaceRecord {
  id: string;
  title: string;
  brand: string;
  city: string;
  category: string;
  condition: string;
  price: number;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export interface LeagueStandingRecord {
  id: string;
  tournamentId: string;
  teamId: string;
  [key: string]: unknown;
}

export interface ActivityFeedRecord {
  id: string;
  type: string;
  [key: string]: unknown;
}

export interface CatalogRecord {
  id: string;
  [key: string]: unknown;
}

/** Strongly typed payload per logical collection stored in Prisma's JSON records. */
export interface RecordPayloadMap {
  users: UserRecord;
  authCredentials: AuthCredentialRecord;
  authSessions: AuthSessionRecord;
  roleRequests: RoleRequestRecord;
  players: PlayerRecord;
  teams: TeamRecord;
  clubs: ClubRecord;
  matches: MatchRecord;
  tournaments: TournamentRecord;
  pitches: PitchRecord;
  bookings: BookingRecord;
  recruitmentAds: RecruitmentAdRecord;
  applications: ApplicationRecord;
  marketplace: MarketplaceRecord;
  notifications: NotificationRecord;
  teamInvitations: TeamInvitationRecord;
  teamJoinRequests: TeamJoinRequestRecord;
  standings: LeagueStandingRecord;
  activity: ActivityFeedRecord;
  catalogs: CatalogRecord;
}
