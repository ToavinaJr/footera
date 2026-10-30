import { test as base, expect } from '@playwright/test';
import type { Application, Booking, MarketplaceListing, Match, Pitch, Player, RecruitmentAd, Team, Tournament, UserProfile } from '../../src/types';

const avatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect width="320" height="240" fill="#17533b"/><circle cx="160" cy="120" r="70" fill="none" stroke="#d4f36a" stroke-width="3"/><path d="M160 0v240M0 120h320" stroke="#d4f36a" opacity=".3"/><text x="160" y="142" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="64" fill="#d4f36a">F</text></svg>');
const date = '2099-10-29';

function initialState() {
  const user: UserProfile = { id: 'user-1', name: 'Toavina', email: 'test@example.test', phone: '0341234567', city: 'Antananarivo', avatarUrl: avatar, activeRole: 'Entraîneur', roles: ['Joueur', 'Entraîneur', 'Gestionnaire Terrain', 'Organisateur Tournoi', 'Vendeur'], favoriteTeamIds: ['team-1'], favoriteMatchIds: ['match-1'], favoriteTournamentIds: ['cup-1'], favoritePlayerIds: [], preferences: { language: 'fr' }, sportsCv: { height: 180, weight: 75, strongFoot: 'Droit', primaryPosition: 'Milieu', secondaryPosition: '', experienceYears: 5, preferredNumber: 10, currentTeam: 'Betsileo FC', bio: 'Passionné de football.' } };
  const team: Team = { id: 'team-1', name: 'Betsileo FC', shortName: 'BFC', city: 'Fianarantsoa', category: 'Senior', division: 'R2', logoUrl: avatar, coverUrl: avatar, coachName: 'Toavina', membersCount: 1, isRecruiting: true, recentForm: ['V', 'N'], members: [{ playerId: 'player-1', name: 'Joueur 1', position: 'Milieu', jerseyNumber: 10, role: 'Capitaine', avatarUrl: avatar }], stats: { matchesPlayed: 3, wins: 2, draws: 1, losses: 0, goalsFor: 5, goalsAgainst: 2, goalDifference: 3, points: 7, position: 1 } };
  const players: Player[] = Array.from({ length: 15 }, (_, index) => ({ id: `player-${index + 1}`, name: `Joueur ${index + 1}`, city: 'Fianarantsoa', avatarUrl: avatar, age: 25, primaryPosition: 'Milieu', strongFoot: 'Droit', currentTeam: team.name, currentTeamId: team.id, level: 'Régional', height: 180, weight: 75, appearances: 10, goals: 3, assists: 2, yellowCards: 1, isAvailableForTransfer: true, bio: 'Milieu de terrain disponible.', previousClubs: [] }));
  const match: Match = { id: 'match-1', homeTeam: { id: team.id, name: team.name, logoUrl: avatar, score: 0 }, awayTeam: { id: 'team-2', name: 'AS Analakely', logoUrl: avatar, score: 0 }, status: 'SCHEDULED', date, scheduledAt: date + 'T15:30:00Z', time: '15:30', venue: 'Stade Municipal', city: team.city, competition: 'Championnat R2', events: [] };
  const tournament: Tournament = { id: 'cup-1', title: 'Coupe Footera', format: '11v11', city: team.city, venue: match.venue, startDate: date, endDate: '2099-10-30', maxTeams: 16, registeredTeams: 1, entryFee: 100, prizePool: 500, status: 'INSCRIPTIONS_OUVERTES', bannerUrl: avatar, organizer: 'Toavina', standings: [], fixtures: [], registrationOpen: true, canManageGallery: true };
  const pitch: Pitch = { id: 'pitch-1', name: 'Terrain Central', complexName: 'Complexe Footera', city: team.city, address: 'Rue du Stade', surface: 'Synthétique', gameFormat: '5v5', dimensions: '40 x 20 m', imageUrl: avatar, hourlyRate: 50, rating: 4.5, reviewsCount: 2, amenities: ['Éclairage'], availableSlots: [{ id: 'slot-1', time: '18:00 - 19:00', price: 50, isAvailable: true }, { id: 'slot-2', time: '19:00 - 20:00', price: 50, isAvailable: true }], canManageGallery: true, reviews: [] };
  const listing: MarketplaceListing = { id: 'listing-1', title: 'Crampons de football', category: 'Chaussures', price: 80, condition: 'Très bon état', brand: 'Nike', size: '42', city: team.city, imageUrl: avatar, sellerName: 'Toavina', sellerRating: 4.8, description: 'Paire de crampons pour terrain synthétique.', createdAt: '2026-10-20T12:00:00Z', isAvailable: true, isMine: true };
  const ad: RecruitmentAd = { id: 'ad-1', teamId: team.id, teamName: team.name, teamLogoUrl: avatar, city: team.city, positionSought: 'Milieu', category: 'Senior', division: 'R2', description: 'Nous cherchons un milieu pour notre équipe.', requirements: ['Disponible le samedi'], createdAt: '2026-10-20T12:00:00Z', candidatesCount: 0, contactEmail: 'staff@example.test' };
  return { user, team, players, match, tournament, pitch, listing, ad, applications: [] as Application[], bookings: [] as Booking[], sessions: [{ id: 'session-1', current: true, expiresAt: date + 'T12:00:00Z' }, { id: 'session-2', current: false, expiresAt: date + 'T12:00:00Z' }], calls: [] as { method: string; path: string; body: any }[], unknown: [] as string[], failures: new Set<string>(), loggedIn: true };
}

type MockApi = ReturnType<typeof initialState>;
export const test = base.extend<{ api: MockApi }>({
  api: [async ({ page }, use) => {
    const state = initialState();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Keep browser tests deterministic and offline, including font/image requests.
    await page.route(/https:\/\/(?:fonts\.|images\.)/, (route) => route.fulfill({ body: '' }));
    await page.route('**/api/v1/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.split('/api/v1/')[1];
      const method = request.method();
      const body = request.postDataJSON();
      state.calls.push({ path, method, body });
      const reply = (json: unknown, status = 200) => route.fulfill({ status, json });
      if (state.failures.has(path)) return reply({ message: 'Service temporairement indisponible' }, 503);
      if (path === 'auth/me') return reply(state.loggedIn ? state.user : { message: 'Session expirée' }, state.loggedIn ? 200 : 401);
      if (path === 'auth/preferences') { Object.assign(state.user.preferences!, body); return reply(state.user); }
      if (path === 'auth/profile') { Object.assign(state.user, body); return reply(state.user); }
      if (path === 'auth/sports-cv') { Object.assign(state.user.sportsCv, body); return reply(state.user); }
      if (path === 'auth/role') { state.user.activeRole = body.role; return reply(state.user); }
      if (path === 'auth/sessions') return reply(state.sessions);
      if (path.startsWith('auth/sessions/') && method === 'DELETE') { state.sessions = state.sessions.filter((session) => session.id !== path.split('/')[2]); return reply({ success: true }); }
      if (path === 'auth/password') return reply({ success: true });
      if (path === 'auth/logout') { state.loggedIn = false; return reply({ success: true }); }
      if (path === 'auth/refresh') return reply({ message: 'Expirée' }, 401);
      if (path.startsWith('favorites/')) {
        const [, entity, id] = path.split('/');
        const field = ({ players: 'favoritePlayerIds', teams: 'favoriteTeamIds', matches: 'favoriteMatchIds', tournaments: 'favoriteTournamentIds' } as const)[entity as 'players'];
        const ids = state.user[field] ?? [];
        state.user[field] = body.favorite ? [...new Set([...ids, id])] : ids.filter((value) => value !== id);
        return reply({ isFavorite: body.favorite });
      }
      if (path === 'dashboard') return reply({ myTeam: state.team, canManageTeam: true, nextTeamMatch: state.match, favoriteTeams: state.user.favoriteTeamIds.length ? [state.team] : [], favoritePlayers: state.players.filter((player) => state.user.favoritePlayerIds?.includes(player.id)), followedMatches: state.user.favoriteMatchIds.length ? [state.match] : [], favoriteTournaments: [state.tournament], bookings: state.bookings, applications: state.applications, pendingActions: { applications: state.applications.length, bookings: state.bookings.length, roles: 0 }, personalActivity: [{ id: 'own-event', title: 'Bienvenue dans votre équipe', description: 'Votre équipe prépare son prochain match.', targetSection: 'teams', targetId: state.team.id }], platformActivity: [{ id: 'public-event', title: 'Les inscriptions sont ouvertes', description: 'La Coupe Footera accueille les équipes.', createdAt: '2026-10-20T12:00:00Z', targetSection: 'tournaments', targetId: state.tournament.id }] });
      if (path === 'catalogs') return reply({ pitchSurfaces: ['Synthétique', 'Naturel'], pitchFormats: ['5v5', '11v11'], pitchAmenities: ['Éclairage'], tournamentFormats: ['11v11'], marketplaceCategories: ['Chaussures'], marketplaceConditions: ['Très bon état'], marketplaceBrands: ['Nike'], playerPositions: ['Milieu', 'Gardien'], recruitmentPositions: ['Milieu', 'Gardien'], playerLevels: ['Régional'], strongFeet: ['Droit', 'Gauche'] });
      if (path === 'players/options') return reply({ positions: ['Milieu', 'Gardien'], levels: ['Régional'] });
      if (path === 'players') return reply(state.players.filter((player) => (!url.searchParams.get('q') || player.name.toLowerCase().includes(url.searchParams.get('q')!.toLowerCase())) && (!url.searchParams.get('position') || player.primaryPosition === url.searchParams.get('position'))));
      if (path === 'players/me') return reply(state.players[0]);
      if (/^players\/[^/]+\/stats$/.test(path)) return reply({ appearances: 10, goals: 3, assists: 2, yellowCards: 1, redCards: 0, minutesPlayed: null, teamStats: [] });
      if (/^players\/[^/]+\/invite$/.test(path)) return reply({ success: true, message: 'Invitation envoyée', invitation: { id: 'invite-1', playerId: path.split('/')[1], teamId: state.team.id, status: 'PENDING' } });
      if (/^players\/[^/]+$/.test(path)) return reply(state.players.find((player) => player.id === path.split('/')[1]) ?? state.players[0]);
      if (path === 'teams' || path === 'tournaments/cup-1/teams') return reply([state.team]);
      if (path === 'teams/my-team') return reply({ team: state.team });
      if (path === 'teams/team-1/reminders') return reply({ sent: 1 });
      if (path === 'teams/team-1/detail') return reply({ ...state.team, competitions: [{ id: 'cup-1', title: state.tournament.title }] });
      if (path === 'teams/team-1' || path === 'teams/team-2') return reply(state.team);
      if (['clubs', 'teams/my-team/invitations', 'teams/my-join-requests', 'teams/my-team/join-requests'].includes(path)) return reply([]);
      if (path === 'matches/manageable') return reply([state.match.id]);
      if (path === 'matches/standings') return reply([]);
      if (path === 'matches') return reply(!url.searchParams.get('status') || url.searchParams.get('status') === state.match.status ? [state.match] : []);
      if (path === 'matches/match-1/start') { state.match.status = 'LIVE'; return reply(state.match); }
      if (path === 'matches/match-1/finish') { state.match.status = 'FINISHED'; return reply(state.match); }
      if (path === 'matches/match-1') { if (method === 'PUT') Object.assign(state.match, body); return reply(state.match); }
      if (path === 'tournaments') return reply([state.tournament]);
      if (path === 'tournaments/cup-1') return reply(state.tournament);
      if (path === 'tournaments/cup-1/register') { state.tournament.registeredTeams++; return reply(true); }
      if (path === 'tournaments/my-pitches' || path === 'tournaments/cup-1/pitches' || path === 'pitches') return reply([state.pitch]);
      if (path === 'pitches/pitch-1') return reply(state.pitch);
      if (path === 'pitches/pitch-1/reviews') { state.pitch.myRating = body.rating; return reply(state.pitch); }
      if (path === 'marketplace/categories') return reply(['Chaussures']);
      if (path === 'marketplace') return reply(url.searchParams.get('q') === 'absent' ? [] : [state.listing]);
      if (path === 'marketplace/listing-1') return reply(state.listing);
      if (path === 'recruitment/ads/available' || path === 'recruitment/ads') return reply(state.applications.some((item) => item.status === 'EN_REVUE') || url.searchParams.get('q') === 'absent' ? [] : [state.ad]);
      if (path === 'recruitment/ads/ad-1') return reply(state.ad);
      if (path === 'recruitment/my-applications') return reply(state.applications);
      if (path === 'recruitment/ads/ad-1/apply') {
        const application: Application = { ...body, id: 'application-1', adId: state.ad.id, adTitle: state.ad.positionSought, teamName: state.team.name, applicantName: state.user.name, applicantPosition: 'Milieu', status: 'EN_REVUE', submittedAt: new Date().toISOString() };
        state.applications.push(application); return reply(application);
      }
      if (path === 'recruitment/my-applications/application-1/cancel') { state.applications[0].status = 'RETIRÉE'; return reply(state.applications[0]); }
      if (path === 'bookings') return reply(state.bookings);
      if (path === 'bookings/quote') return reply({ total: body.selections.length * 50, perDate: Object.fromEntries(body.selections.map((selection: { date: string }) => [selection.date, 50])) });
      if (path === 'bookings/batch') {
        state.bookings = body.selections.map((selection: { date: string; time: string }, index: number) => ({ id: `booking-${index + 1}`, pitchId: state.pitch.id, pitchName: state.pitch.name, complexName: state.pitch.complexName, surface: state.pitch.surface, ...selection, totalPrice: 50, durationMinutes: 60, status: 'PENDING', bookerName: state.user.name, bookerPhone: state.user.phone, createdAt: new Date().toISOString() }));
        state.pitch.availableSlots[0].isAvailable = false; return reply(state.bookings);
      }
      if (path === 'bookings/booking-1/cancel') { state.bookings[0].status = 'CANCELLED'; return reply(true); }
      if (path === 'role-requests') return reply({ requests: [], availableRoles: ['Vendeur'] });
      if (path.startsWith('galleries/')) return reply({ photos: [], canManage: true });
      if (path.startsWith('stats/') || path === 'notifications') return reply([]);
      if (path.startsWith('notifications/')) return reply({ success: true });
      state.unknown.push(method + ' ' + path);
      return reply({ message: 'Missing test fixture: ' + path }, 500);
    });
    await use(state);
    expect(state.unknown, 'Every API request must have an explicit fixture').toEqual([]);
    expect(errors, 'No uncaught browser errors').toEqual([]);
  }, { auto: true }],
});
export { expect };
