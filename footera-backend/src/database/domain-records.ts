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
  dateOfBirth?: string;
  age?: number;
  sportsCv?: SportsCvRecord;
  [key: string]: unknown;
}

export interface AuthCredentialRecord { userId: string; passwordHash: string }
export interface AuthSessionRecord { userId: string; expiresAt: string }

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
  experienceYears?: number;
  isAvailableForTransfer?: boolean;
  rating?: number;
  bio?: string;
  previousClubs?: string[];
  teamHistoryStats?: Array<Record<string, unknown>>;
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
  type: string;
  teamId: string;
  playerId?: string;
  player: string;
  assistPlayerId?: string;
  assist?: string;
  description?: string;
}

export interface MatchRecord {
  id: string;
  tournamentId?: string;
  status: string;
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
}

export interface PitchRecord {
  id: string;
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
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface TournamentRecord {
  id: string;
  organizerId?: string;
  title?: string;
  status?: string;
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
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  targetSection: string;
  targetId?: string;
  recipientId: string;
  invitationId?: string;
  invitationStatus?: string;
  time?: string;
  createdAt: string;
  isRead: boolean;
  [key: string]: unknown;
}

export interface ClubRecord {
  id: string;
  name: string;
  logoUrl: string;
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
