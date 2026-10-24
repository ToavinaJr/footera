export type Position = string;

export type StrongFoot = string;

export interface CatalogOptions {
  pitchSurfaces: string[];
  pitchFormats: string[];
  pitchAmenities: string[];
  tournamentFormats: string[];
  marketplaceCategories: string[];
  marketplaceConditions: string[];
  marketplaceBrands: string[];
  playerPositions: string[];
  recruitmentPositions: string[];
  playerLevels: string[];
  strongFeet: string[];
}

export type UserRole = 
  | 'Joueur'
  | 'Entraîneur'
  | 'Gestionnaire Terrain'
  | 'Organisateur Tournoi'
  | 'Vendeur'
  | 'Supporter';

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  experienceYears?: number;
  city: string;
  avatarUrl: string;
  primaryPosition: Position;
  secondaryPosition?: Position;
  strongFoot: StrongFoot;
  currentTeam?: string;
  currentTeamId?: string;
  level: string;
  height: number; // in cm
  weight: number; // in kg
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards?: number;
  minutesPlayed?: number | null;
  isAvailableForTransfer: boolean;
  bio: string;
  previousClubs: string[];
  teamHistoryStats?: Array<{
    teamId?: string;
    teamName: string;
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards?: number;
    minutesPlayed?: number | null;
  }>;
}

export interface TeamMember {
  playerId: string;
  name: string;
  position: Position;
  jerseyNumber: number;
  role: 'Capitaine' | 'Joueur' | 'Vice-Capitaine' | 'Gardien Titulaire';
  avatarUrl: string;
  age?: number;
  matchesPlayed?: number;
  appearances?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  minutesPlayed?: number | null;
  competitionStats?: Array<{
    competitionId: string;
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number | null;
  }>;
}

export interface NextMatchInfo {
  id: string;
  opponentName: string;
  opponentLogo: string;
  date: string;
  time: string;
  venue: string;
  competition: string;
  isHome: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  clubName?: string;
  clubId?: string;
  logoUrl: string;
  coverUrl: string;
  category: 'Senior' | 'U19' | 'U17' | 'Vétérans' | 'Féminine';
  division: string;
  competitionId?: string;
  coachName: string;
  membersCount: number;
  isRecruiting: boolean;
  recentForm: ('V' | 'N' | 'D')[]; // e.g. ['D', 'D', 'N', 'V', 'D']
  nextMatch?: NextMatchInfo;
  members: TeamMember[];
  stats: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    goalsPerMatch?: number;
    points: number;
    position: number;
  };
}

export interface Club {
  id: string;
  name: string;
  city: string;
  stadiumName: string;
  foundedYear: number;
  logoUrl: string;
  teamsCount: number;
  membersTotal: number;
  presidentName: string;
  canManageLogo?: boolean;
  teams: { id: string; name: string; category: string }[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'penalty';
  teamId: string;
  playerId: string;
  player: string;
  assistPlayerId?: string;
  assist?: string;
  substitutedPlayerId?: string;
  description?: string;
}

export interface MatchStats {
  possession: [number, number]; // [home, away]
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
}

export interface Match {
  id: string;
  tournamentId?: string;
  homeTeam: {
    id: string;
    name: string;
    logoUrl: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    logoUrl: string;
    score: number;
  };
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  date: string;
  playedAt?: string;
  scheduledAt?: string;
  time: string;
  venue: string;
  pitchId?: string;
  pitchName?: string;
  city: string;
  competition: string;
  minute?: number;
  events: MatchEvent[];
  lineups?: Array<{ teamId: string; playerIds: string[] }>;
  stats?: MatchStats;
}

export interface MatchUpdateInput {
  date: string;
  time: string;
  venue: string;
  events: MatchEventInput[];
  lineups?: Array<{ teamId: string; playerIds: string[] }>;
}

export interface MatchEventInput {
  minute: number;
  type: MatchEvent['type'];
  teamId: string;
  playerId: string;
  assistPlayerId?: string;
  substitutedPlayerId?: string;
  description?: string;
}

export interface TeamMatch extends Match {
  goalScorers: MatchEvent[];
  isHome: boolean;
}

export interface TeamDetail extends Team {
  competitions: Array<{ id: string; title: string }>;
  recentMatches: TeamMatch[];
  upcomingMatches: TeamMatch[];
  topScorers: Array<{ playerId: string; playerName: string; goals: number }>;
}

export interface LeagueStandingRow {
  position: number;
  teamId: string;
  teamName: string;
  logoUrl: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('V' | 'N' | 'D')[];
}

export interface TournamentStanding {
  position: number;
  teamId: string;
  teamName: string;
  logoUrl: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TournamentMatchFixture {
  round: string;
  homeTeam: string;
  awayTeam: string;
  score?: string;
  date: string;
  isFinished: boolean;
}

export interface TournamentStadium {
  id: string;
  name: string;
  pitchId?: string;
  city?: string;
  address?: string;
}

export interface Tournament {
  id: string;
  title: string;
  format: string;
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  registeredTeams: number;
  participantTeamIds?: string[];
  participatingTeams?: Team[];
  stadiums?: TournamentStadium[];
  registrationOpen?: boolean;
  remainingTeams?: number;
  entryFee: number; // in EUR
  prizePool: number; // in EUR
  status: 'INSCRIPTIONS_OUVERTES' | 'EN_COURS' | 'TERMINE';
  bannerUrl: string;
  organizer: string;
  standings: TournamentStanding[];
  fixtures: TournamentMatchFixture[];
  canManageGallery?: boolean;
}

export type SurfaceType = string;

export interface PitchOptions {
  surfaces: SurfaceType[];
  formats: string[];
  amenities: string[];
}

export interface PitchSlot {
  id: string;
  time: string;
  price: number;
  isAvailable: boolean;
}

export interface PitchReview {
  userId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Pitch {
  id: string;
  name: string;
  complexName: string;
  city: string;
  address: string;
  surface: SurfaceType;
  gameFormat?: string;
  dimensions: string; // e.g. "105m x 68m" or "30m x 18m"
  imageUrl: string;
  hourlyRate: number;
  rating: number;
  reviewsCount: number;
  /** Internal aggregate baseline used when appending user-submitted reviews. */
  ratingBase?: number;
  reviewsCountBase?: number;
  reviews?: PitchReview[];
  myRating?: number;
  myReview?: PitchReview;
  amenities: string[];
  availableSlots: PitchSlot[];
  canManageGallery?: boolean;
}

export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

export interface Booking {
  id: string;
  userId?: string;
  pitchId: string;
  pitchName: string;
  complexName: string;
  surface: SurfaceType;
  date: string;
  time: string;
  durationMinutes: number;
  totalPrice: number;
  bookerName: string;
  bookerPhone: string;
  teamName?: string;
  status: BookingStatus;
  createdAt: string;
}

export interface RecruitmentAd {
  id: string;
  teamId: string;
  teamName: string;
  teamLogoUrl: string;
  clubName?: string;
  city: string;
  positionSought: string;
  category: string;
  division: string;
  description: string;
  requirements: string[];
  createdAt: string;
  candidatesCount: number;
  contactEmail: string;
}

export interface Application {
  id: string;
  userId?: string;
  adId: string;
  adTitle: string;
  teamName: string;
  applicantName: string;
  applicantPosition: Position;
  phone: string;
  message: string;
  submittedAt: string;
  status: 'EN_REVUE' | 'ACCEPTEE' | 'REFUSEE' | 'RETIRÉE';
}

export interface MarketplaceListing {
  id: string;
  title: string;
  category: string;
  price: number;
  condition: string;
  brand: string;
  size?: string;
  city: string;
  imageUrl: string;
  sellerName: string;
  sellerRating: number;
  description: string;
  createdAt: string;
  isAvailable: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'match' | 'booking' | 'recruitment' | 'team' | 'marketplace' | 'system';
  targetSection: string;
  targetId?: string;
  recipientId?: string;
  invitationId?: string;
  invitationStatus?: TeamInvitationStatus;
}

export type TeamInvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  senderId?: string;
  senderName?: string;
  message: string;
  status: TeamInvitationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'match_result' | 'new_player' | 'booking' | 'recruitment_ad';
  title: string;
  time: string;
  description: string;
  badgeText: string;
  targetSection: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  age?: number;
  city: string;
  avatarUrl: string;
  activeRole: UserRole;
  roles: UserRole[];
  favoriteTeamIds: string[];
  favoriteMatchIds: string[];
  favoriteTournamentIds: string[];
  sportsCv: {
    height: number;
    weight: number;
    strongFoot: StrongFoot;
    primaryPosition: Position;
    secondaryPosition: Position;
    experienceYears: number;
    preferredNumber: number;
    currentTeam: string;
    bio: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

export interface TopScorerItem {
  rank: number;
  playerId: string;
  playerName: string;
  avatarUrl: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  tournamentId?: string;
  tournamentTitle?: string;
  position: Position;
  matchesPlayed: number;
  goals: number;
  penalties: number;
  ratio: number;
  minutesPerGoal: number | null;
}

export interface TopAssisterItem {
  rank: number;
  playerId: string;
  playerName: string;
  avatarUrl: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  tournamentId?: string;
  tournamentTitle?: string;
  position: Position;
  matchesPlayed: number;
  assists: number;
  keyPasses: number;
  ratio: number;
}

export interface TeamStatsItem {
  teamId: string;
  teamName: string;
  shortName: string;
  logoUrl: string;
  city: string;
  division: string;
  tournamentId?: string;
  tournamentTitle?: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number; // in %
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  goalsPerMatch: number;
  goalsAgainstPerMatch: number;
  cleanSheets: number;
  possessionAvg: number | null; // unavailable until tracked per match
  passAccuracy: number | null;
  shotsPerMatch: number | null;
  yellowCards: number;
  redCards: number;
  points: number;
  recentForm: ('V' | 'N' | 'D')[];
  topScorer: { name: string; playerId?: string; goals: number; avatarUrl?: string };
  topAssister: { name: string; playerId?: string; assists: number; avatarUrl?: string };
}

export interface PlayerStatsItem {
  playerId: string;
  name: string;
  avatarUrl: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  position: Position;
  strongFoot: StrongFoot;
  age?: number;
  appearances: number;
  minutesPlayed: number | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets?: number;
}

