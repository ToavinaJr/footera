import {
  Player,
  Team,
  Club,
  Match,
  Tournament,
  Pitch,
  Booking,
  RecruitmentAd,
  Application,
  MarketplaceListing,
  NotificationItem,
  UserProfile,
  LeagueStandingRow,
  ActivityFeedItem,
} from '../types';

import {
  INITIAL_USER_PROFILE,
  INITIAL_PLAYERS,
  INITIAL_TEAMS,
  INITIAL_CLUBS,
  INITIAL_MATCHES,
  INITIAL_TOURNAMENTS,
  INITIAL_PITCHES,
  INITIAL_BOOKINGS,
  INITIAL_RECRUITMENT_ADS,
  INITIAL_APPLICATIONS,
  INITIAL_MARKETPLACE,
  INITIAL_NOTIFICATIONS,
  INITIAL_LEAGUE_STANDINGS,
  INITIAL_ACTIVITY_FEED,
} from './fixtures';

const STORAGE_KEYS = {
  PROFILE: 'footera_mock_profile_v2',
  PLAYERS: 'footera_mock_players_v2',
  TEAMS: 'footera_mock_teams_v2',
  CLUBS: 'footera_mock_clubs_v2',
  MATCHES: 'footera_mock_matches_v2',
  TOURNAMENTS: 'footera_mock_tournaments_v2',
  PITCHES: 'footera_mock_pitches_v2',
  BOOKINGS: 'footera_mock_bookings_v2',
  RECRUITMENT: 'footera_mock_recruitment_v2',
  APPLICATIONS: 'footera_mock_applications_v2',
  MARKETPLACE: 'footera_mock_marketplace_v2',
  NOTIFICATIONS: 'footera_mock_notifications_v2',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function emitChange() {
  listeners.forEach((l) => l());
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[Footera MockStorage] Failed to save key ${key}:`, e);
  }
}

class MockStorageRepository {
  private profile: UserProfile;
  private players: Player[];
  private teams: Team[];
  private clubs: Club[];
  private matches: Match[];
  private tournaments: Tournament[];
  private pitches: Pitch[];
  private bookings: Booking[];
  private recruitmentAds: RecruitmentAd[];
  private applications: Application[];
  private marketplace: MarketplaceListing[];
  private notifications: NotificationItem[];
  private standings: LeagueStandingRow[];
  private activityFeed: ActivityFeedItem[];

  constructor() {
    this.profile = loadFromStorage(STORAGE_KEYS.PROFILE, INITIAL_USER_PROFILE);
    this.players = loadFromStorage(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    this.teams = loadFromStorage(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    this.clubs = loadFromStorage(STORAGE_KEYS.CLUBS, INITIAL_CLUBS);
    this.matches = loadFromStorage(STORAGE_KEYS.MATCHES, INITIAL_MATCHES);
    this.tournaments = loadFromStorage(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    this.pitches = loadFromStorage(STORAGE_KEYS.PITCHES, INITIAL_PITCHES);
    this.bookings = loadFromStorage(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    this.recruitmentAds = loadFromStorage(STORAGE_KEYS.RECRUITMENT, INITIAL_RECRUITMENT_ADS);
    this.applications = loadFromStorage(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    this.marketplace = loadFromStorage(STORAGE_KEYS.MARKETPLACE, INITIAL_MARKETPLACE);
    this.notifications = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.standings = INITIAL_LEAGUE_STANDINGS;
    this.activityFeed = INITIAL_ACTIVITY_FEED;
  }

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  // Profile & Roles
  getProfile(): UserProfile {
    return structuredClone(this.profile);
  }

  updateProfile(partial: Partial<UserProfile>): UserProfile {
    this.profile = { ...this.profile, ...partial };
    saveToStorage(STORAGE_KEYS.PROFILE, this.profile);
    emitChange();
    return structuredClone(this.profile);
  }

  updateSportsCv(sportsCv: Partial<UserProfile['sportsCv']>): UserProfile {
    this.profile.sportsCv = { ...this.profile.sportsCv, ...sportsCv };
    saveToStorage(STORAGE_KEYS.PROFILE, this.profile);
    emitChange();
    return structuredClone(this.profile);
  }

  setActiveRole(role: UserProfile['activeRole']): UserProfile {
    this.profile.activeRole = role;
    saveToStorage(STORAGE_KEYS.PROFILE, this.profile);
    emitChange();
    return structuredClone(this.profile);
  }

  // Players
  getPlayers(): Player[] {
    return structuredClone(this.players);
  }

  getPlayerById(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  // Teams & Clubs
  getTeams(): Team[] {
    return structuredClone(this.teams);
  }

  getTeamById(id: string): Team | undefined {
    return this.teams.find((t) => t.id === id);
  }

  getMyTeam(): Team | undefined {
    const teamName = this.profile.sportsCv.currentTeam;
    return this.teams.find((t) => t.name === teamName) || this.teams[0];
  }

  getClubs(): Club[] {
    return structuredClone(this.clubs);
  }

  updateClubLogo(clubId: string, logoUrl: string): Club {
    const club = this.clubs.find((candidate) => candidate.id === clubId);
    const team = this.teams.find((candidate) => candidate.name === this.profile.sportsCv.currentTeam);
    if (this.profile.activeRole !== 'Entraîneur' || !club || !team || !club.teams.some((item) => item.id === team.id)) {
      throw new Error('Vous ne pouvez modifier que le logo du club de votre équipe avec le rôle Entraîneur.');
    }
    club.logoUrl = logoUrl;
    saveToStorage(STORAGE_KEYS.CLUBS, this.clubs);
    emitChange();
    return structuredClone(club);
  }

  joinTeam(teamId: string, message: string): { success: boolean; message: string } {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false, message: 'Équipe introuvable' };

    const isAlreadyMember = team.members.some((m) => m.playerId === this.profile.id);
    if (isAlreadyMember) {
      return { success: false, message: 'Vous êtes déjà membre de cette équipe.' };
    }

    team.members.push({
      playerId: this.profile.id,
      name: this.profile.name,
      position: this.profile.sportsCv.primaryPosition,
      jerseyNumber: this.profile.sportsCv.preferredNumber || 14,
      role: 'Joueur',
      avatarUrl: this.profile.avatarUrl,
      age: 25,
      matchesPlayed: 0,
      goals: 0,
    });
    team.membersCount += 1;
    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);

    this.addNotification({
      title: 'Demande transmise au staff',
      message: `Votre demande pour rejoindre ${team.name} a bien été enregistrée. Message: "${message.slice(0, 40)}..."`,
      type: 'team',
      targetSection: 'teams',
      targetId: team.id,
    });

    emitChange();
    return { success: true, message: `Bienvenue dans l'équipe ${team.name} !` };
  }

  // Matches & Standings
  getMatches(): Match[] {
    return structuredClone(this.matches);
  }

  getMatchById(id: string): Match | undefined {
    return this.matches.find((m) => m.id === id);
  }

  getLeagueStandings(): LeagueStandingRow[] {
    return structuredClone(this.standings);
  }

  getActivityFeed(): ActivityFeedItem[] {
    return structuredClone(this.activityFeed);
  }

  // Tournaments
  getTournaments(): Tournament[] {
    return structuredClone(this.tournaments);
  }

  getTournamentById(id: string): Tournament | undefined {
    return this.tournaments.find((t) => t.id === id);
  }

  registerTeamForTournament(tournamentId: string, teamName: string): boolean {
    const tourn = this.tournaments.find((t) => t.id === tournamentId);
    if (!tourn) return false;
    tourn.registeredTeams += 1;
    saveToStorage(STORAGE_KEYS.TOURNAMENTS, this.tournaments);

    this.addNotification({
      title: 'Inscription au tournoi',
      message: `L'équipe ${teamName} est pré-inscrite pour ${tourn.title}.`,
      type: 'system',
      targetSection: 'tournaments',
      targetId: tourn.id,
    });

    emitChange();
    return true;
  }

  createTournament(input: {
    title: string;
    format: Tournament['format'];
    city: string;
    venue: string;
    startDate: string;
    endDate: string;
    maxTeams: number;
    entryFee: number;
    prizePool: number;
    bannerUrl: string;
    organizer: string;
  }): Tournament {
    const newTourn: Tournament = {
      ...input,
      id: `tourn_${Date.now()}`,
      registeredTeams: 1,
      status: 'INSCRIPTIONS_OUVERTES',
      standings: [],
      fixtures: [],
    };
    this.tournaments.unshift(newTourn);
    saveToStorage(STORAGE_KEYS.TOURNAMENTS, this.tournaments);

    this.addNotification({
      title: 'Nouveau tournoi ouvert',
      message: `Le tournoi "${newTourn.title}" est maintenant ouvert aux inscriptions !`,
      type: 'system',
      targetSection: 'tournaments',
      targetId: newTourn.id,
    });

    emitChange();
    return structuredClone(newTourn);
  }

  // Pitches & Bookings
  getPitches(): Pitch[] {
    return structuredClone(this.pitches);
  }

  getPitchById(id: string): Pitch | undefined {
    return this.pitches.find((p) => p.id === id);
  }

  createPitch(input: {
    name: string;
    complexName: string;
    city: string;
    address: string;
    surface: Pitch['surface'];
    dimensions: string;
    imageUrl: string;
    hourlyRate: number;
    amenities: string[];
    availableSlots: Pitch['availableSlots'];
  }): Pitch {
    const newPitch: Pitch = {
      ...input,
      id: `pitch_${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
    };
    this.pitches.unshift(newPitch);
    saveToStorage(STORAGE_KEYS.PITCHES, this.pitches);

    this.addNotification({
      title: 'Nouveau terrain disponible',
      message: `Le terrain "${newPitch.name}" est désormais réservable sur Footera.`,
      type: 'booking',
      targetSection: 'pitches',
      targetId: newPitch.id,
    });

    emitChange();
    return structuredClone(newPitch);
  }

  getBookings(): Booking[] {
    return structuredClone(this.bookings);
  }

  createBooking(input: {
    pitchId: string;
    date: string;
    time: string;
    teamName?: string;
    totalPrice: number;
  }): Booking {
    const pitch = this.pitches.find((p) => p.id === input.pitchId);
    const slot = pitch?.availableSlots.find((candidate) => candidate.time === input.time && candidate.isAvailable);
    const alreadyBooked = this.bookings.some((booking) => booking.pitchId === input.pitchId
      && booking.date === input.date && booking.time === input.time && booking.status !== 'CANCELLED');
    if (!slot || alreadyBooked) {
      throw new Error('Ce créneau n’est plus disponible pour cette date.');
    }
    const newBooking: Booking = {
      id: `bkg_${Date.now()}`,
      pitchId: input.pitchId,
      pitchName: pitch ? pitch.name : 'Terrain réservé',
      complexName: pitch ? pitch.complexName : 'Complexe Footera',
      surface: pitch ? pitch.surface : 'Synthétique dernière génération',
      date: input.date,
      time: input.time,
      durationMinutes: 90,
      totalPrice: slot.price,
      bookerName: this.profile.name,
      bookerPhone: this.profile.phone,
      teamName: input.teamName || this.profile.sportsCv.currentTeam,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    this.bookings.unshift(newBooking);
    saveToStorage(STORAGE_KEYS.BOOKINGS, this.bookings);

    this.addNotification({
      title: 'Réservation confirmée',
      message: `Créneau validé le ${input.date} à ${input.time} (${newBooking.pitchName}).`,
      type: 'booking',
      targetSection: 'bookings',
      targetId: newBooking.id,
    });

    emitChange();
    return structuredClone(newBooking);
  }

  cancelBooking(bookingId: string): boolean {
    const b = this.bookings.find((item) => item.id === bookingId);
    if (!b) return false;
    b.status = 'CANCELLED';
    saveToStorage(STORAGE_KEYS.BOOKINGS, this.bookings);

    this.addNotification({
      title: 'Réservation annulée',
      message: `La réservation pour ${b.pitchName} a été annulée.`,
      type: 'booking',
      targetSection: 'bookings',
      targetId: b.id,
    });

    emitChange();
    return true;
  }

  // Recruitment
  getRecruitmentAds(): RecruitmentAd[] {
    return structuredClone(this.recruitmentAds);
  }

  getRecruitmentAdById(id: string): RecruitmentAd | undefined {
    return this.recruitmentAds.find((r) => r.id === id);
  }

  getApplications(): Application[] {
    return structuredClone(this.applications);
  }

  applyToRecruitment(adId: string, applicant: { message: string; phone: string }): Application {
    const ad = this.recruitmentAds.find((r) => r.id === adId);
    if (ad) ad.candidatesCount += 1;

    const newApp: Application = {
      id: `app_${Date.now()}`,
      adId,
      adTitle: ad ? `${ad.positionSought} — ${ad.teamName}` : 'Candidature Footera',
      teamName: ad ? ad.teamName : 'Équipe Footera',
      applicantName: this.profile.name,
      applicantPosition: this.profile.sportsCv.primaryPosition,
      phone: applicant.phone || this.profile.phone,
      message: applicant.message,
      submittedAt: new Date().toISOString(),
      status: 'EN_REVUE',
    };

    this.applications.unshift(newApp);
    saveToStorage(STORAGE_KEYS.APPLICATIONS, this.applications);
    if (ad) saveToStorage(STORAGE_KEYS.RECRUITMENT, this.recruitmentAds);

    this.addNotification({
      title: 'Candidature transmise',
      message: `Votre candidature pour ${newApp.teamName} a été envoyée.`,
      type: 'recruitment',
      targetSection: 'recruitment',
      targetId: adId,
    });

    emitChange();
    return structuredClone(newApp);
  }

  // Marketplace
  getMarketplace(): MarketplaceListing[] {
    return structuredClone(this.marketplace);
  }

  createMarketplaceListing(data: Omit<MarketplaceListing, 'id' | 'createdAt' | 'isAvailable' | 'sellerName' | 'sellerRating'>): MarketplaceListing {
    const newListing: MarketplaceListing = {
      ...data,
      id: `mkt_${Date.now()}`,
      sellerName: this.profile.name,
      sellerRating: 5.0,
      createdAt: "À l'instant",
      isAvailable: true,
    };

    this.marketplace.unshift(newListing);
    saveToStorage(STORAGE_KEYS.MARKETPLACE, this.marketplace);

    this.addNotification({
      title: 'Annonce mise en ligne',
      message: `Votre article "${newListing.title}" (${newListing.price}€) est publié.`,
      type: 'marketplace',
      targetSection: 'marketplace',
      targetId: newListing.id,
    });

    emitChange();
    return structuredClone(newListing);
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    return structuredClone(this.notifications);
  }

  markNotificationRead(id: string): void {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) {
      n.isRead = true;
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      emitChange();
    }
  }

  markAllNotificationsRead(): void {
    this.notifications.forEach((n) => {
      n.isRead = true;
    });
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    emitChange();
  }

  addNotification(item: Omit<NotificationItem, 'id' | 'time' | 'isRead'>): void {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      time: "À l'instant",
      isRead: false,
    };
    this.notifications.unshift(newNotif);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    emitChange();
  }

  // Favorites
  toggleFavoriteTeam(teamId: string): boolean {
    const idx = this.profile.favoriteTeamIds.indexOf(teamId);
    if (idx > -1) {
      this.profile.favoriteTeamIds.splice(idx, 1);
    } else {
      this.profile.favoriteTeamIds.push(teamId);
    }
    saveToStorage(STORAGE_KEYS.PROFILE, this.profile);
    emitChange();
    return this.profile.favoriteTeamIds.includes(teamId);
  }

  toggleFavoriteMatch(matchId: string): boolean {
    const idx = this.profile.favoriteMatchIds.indexOf(matchId);
    if (idx > -1) {
      this.profile.favoriteMatchIds.splice(idx, 1);
    } else {
      this.profile.favoriteMatchIds.push(matchId);
    }
    saveToStorage(STORAGE_KEYS.PROFILE, this.profile);
    emitChange();
    return this.profile.favoriteMatchIds.includes(matchId);
  }

  // Full reset back to initial fixtures
  resetAllData(): void {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    }
    this.profile = structuredClone(INITIAL_USER_PROFILE);
    this.players = structuredClone(INITIAL_PLAYERS);
    this.teams = structuredClone(INITIAL_TEAMS);
    this.clubs = structuredClone(INITIAL_CLUBS);
    this.matches = structuredClone(INITIAL_MATCHES);
    this.tournaments = structuredClone(INITIAL_TOURNAMENTS);
    this.pitches = structuredClone(INITIAL_PITCHES);
    this.bookings = structuredClone(INITIAL_BOOKINGS);
    this.recruitmentAds = structuredClone(INITIAL_RECRUITMENT_ADS);
    this.applications = structuredClone(INITIAL_APPLICATIONS);
    this.marketplace = structuredClone(INITIAL_MARKETPLACE);
    this.notifications = structuredClone(INITIAL_NOTIFICATIONS);
    this.standings = structuredClone(INITIAL_LEAGUE_STANDINGS);
    this.activityFeed = structuredClone(INITIAL_ACTIVITY_FEED);
    emitChange();
  }
}

export const mockStorage = new MockStorageRepository();
