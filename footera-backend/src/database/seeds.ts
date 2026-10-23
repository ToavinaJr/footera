export interface PlayerSeed {
  id: string;
  userId?: string;
  name: string;
  age: number;
  city: string;
  avatarUrl: string;
  primaryPosition: string;
  secondaryPosition?: string;
  strongFoot: string;
  currentTeam?: string;
  currentTeamId?: string;
  level: string;
  height: number;
  weight: number;
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards?: number;
  teamHistoryStats?: Array<{
    teamId?: string;
    teamName: string;
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards?: number;
  }>;
  isAvailableForTransfer: boolean;
  rating?: number;
  bio: string;
  previousClubs: string[];
}

export const SEED_CATALOGS = [
  { id: 'pitch-surfaces', values: ['Synthétique dernière génération', 'Gazon naturel', 'Indoor Five', 'Futsal parquet'] },
  { id: 'pitch-amenities', values: ['Vestiaires avec douches chaudes', 'Éclairage nocturne LED', 'Parking gratuit surveillé', 'Buvette & Club House', 'Tribunes abritées', 'Caméras vidéo HD Replay', 'Chronomètre & Tableau d’affichage', 'Ballons & Chasubles fournis', 'Vestiaires chauffés', 'Parking gratuit', 'Tribunes 500 places', 'Buvette'] },
  { id: 'marketplace-categories', values: ['Crampons', 'Maillots', 'Ballons', 'Gardiens', 'Équipements'] },
  { id: 'marketplace-conditions', values: ['Neuf avec étiquette', 'Comme neuf', 'Très bon état', 'Bon état'] },
  { id: 'marketplace-brands', values: ['Nike', 'Adidas', 'Puma', 'Kipsta', 'Umbro', 'Mizuno', 'Garman Official'] },
  { id: 'player-positions', values: ['Gardien', 'Défenseur Central', 'Latéral Droit', 'Latéral Gauche', 'Milieu Défensif', 'Milieu Central', 'Milieu Offensif', 'Ailier Droit', 'Ailier Gauche', 'Avant-centre'] },
  { id: 'recruitment-positions', values: ['Gardien', 'Défenseur Central', 'Latéral Droit', 'Latéral Gauche', 'Milieu Défensif', 'Milieu Central', 'Milieu Offensif', 'Ailier Droit', 'Ailier Gauche', 'Avant-centre', 'Entraîneur Adjoint', 'Préparateur Physique', 'Entraîneur Principal'] },
  { id: 'player-levels', values: ['Départemental', 'Régional', 'National', 'Loisir'] },
  { id: 'strong-feet', values: ['Droitier', 'Gaucher', 'Ambidextre'] },
];

export interface TeamMemberSeed {
  playerId: string;
  name: string;
  position: string;
  jerseyNumber: number;
  role: string;
  avatarUrl: string;
  age?: number;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
}

export interface TeamSeed {
  id: string;
  competitionId?: string;
  ownerId?: string;
  name: string;
  shortName: string;
  city: string;
  clubName?: string;
  clubId?: string;
  logoUrl: string;
  coverUrl: string;
  category: string;
  division: string;
  coachName: string;
  membersCount: number;
  isRecruiting: boolean;
  recentForm: ('V' | 'N' | 'D')[];
  nextMatch?: {
    id: string;
    opponentName: string;
    opponentLogo: string;
    date: string;
    time: string;
    venue: string;
    competition: string;
    isHome: boolean;
  };
  members: TeamMemberSeed[];
  stats: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    position: number;
  };
}

export const SEED_USER = {
  id: 'usr_me',
  name: 'Alexandre Morel',
  email: 'alex.morel@footera.app',
  phone: '',
  city: 'Antananarivo / Paris',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  activeRole: 'Joueur',
  roles: ['Joueur', 'Entraîneur', 'Gestionnaire Terrain', 'Organisateur Tournoi', 'Vendeur'],
  favoriteTeamIds: ['team_betsileo', 'team_01'],
  favoriteMatchIds: ['match_01'],
  favoriteTournamentIds: ['tourn_01'],
  sportsCv: {
    height: 182,
    weight: 75,
    strongFoot: 'Droitier',
    primaryPosition: 'Milieu Central',
    secondaryPosition: 'Milieu Offensif',
    experienceYears: 12,
    preferredNumber: 8,
    currentTeam: 'Betsileo FC',
    bio: 'Milieu relayeur box-to-box avec excellente vision de jeu et relance rapide. Titulaire avec Betsileo FC.',
  },
};

export const SEED_PLAYERS: PlayerSeed[] = [
  {
    id: 'ply_alex',
    userId: 'usr_me',
    name: 'Alexandre Morel',
    age: 25,
    city: 'Fianarantsoa / Paris',
    avatarUrl: SEED_USER.avatarUrl,
    primaryPosition: 'Milieu Central',
    secondaryPosition: 'Milieu Offensif',
    strongFoot: 'Droitier',
    currentTeam: 'Betsileo FC',
    currentTeamId: 'team_betsileo',
    level: 'Régional',
    height: 182,
    weight: 75,
    appearances: 18,
    goals: 5,
    assists: 11,
    yellowCards: 1,
    isAvailableForTransfer: false,
    rating: 8.4,
    bio: 'Meilleur passeur de Betsileo FC, distribue le jeu avec une grande précision dans le dernier tiers.',
    previousClubs: ['Paris Saint-Germain Jeunes', 'Betsileo AC'],
    teamHistoryStats: [
      { teamId: 'team_betsileo', teamName: 'Betsileo FC', appearances: 18, goals: 5, assists: 11, yellowCards: 1 },
    ],
  },
  {
    id: 'ply_02',
    name: 'Karim Benali',
    age: 26,
    city: 'Fianarantsoa',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&h=400&q=80',
    primaryPosition: 'Avant-centre',
    secondaryPosition: 'Ailier Droit',
    strongFoot: 'Droitier',
    currentTeam: 'Betsileo FC',
    currentTeamId: 'team_betsileo',
    level: 'Régional',
    height: 186,
    weight: 80,
    appearances: 20,
    goals: 16,
    assists: 4,
    yellowCards: 3,
    rating: 8.6,
    isAvailableForTransfer: false,
    bio: 'Buteur puissant, excellent jeu de tête et sens du placement dans la surface. Meilleur buteur de sa division.',
    previousClubs: ['JA Drancy', 'Bobigny FC'],
  },
  {
    id: 'ply_mika',
    name: 'Mika Randrianasolo',
    age: 24,
    city: 'Antananarivo',
    avatarUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&h=400&q=80',
    primaryPosition: 'Milieu Central',
    secondaryPosition: 'Milieu Offensif',
    strongFoot: 'Droitier',
    currentTeam: 'AS Analakely',
    currentTeamId: 'team_analakely',
    level: 'Régional',
    height: 178,
    weight: 71,
    appearances: 19,
    goals: 14,
    assists: 10,
    yellowCards: 1,
    rating: 8.5,
    isAvailableForTransfer: true,
    bio: 'Meneur de jeu agile, spécialisé dans les passes clés et les coups de pied arrêtés. 14 buts et 10 passes.',
    previousClubs: ['FC Barea Espoir', 'US Antananarivo Jeunes'],
  },
  {
    id: 'ply_malik',
    name: 'Malik Touré',
    age: 25,
    city: 'Paris 20e',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=400&q=80',
    primaryPosition: 'Avant-centre',
    secondaryPosition: 'Ailier Gauche',
    strongFoot: 'Droitier',
    currentTeam: 'FC Étoile Belleville',
    currentTeamId: 'team_01',
    level: 'Régional',
    height: 184,
    weight: 78,
    appearances: 18,
    goals: 13,
    assists: 3,
    yellowCards: 2,
    rating: 8.1,
    isAvailableForTransfer: false,
    bio: 'Renard des surfaces rapide et tranchant sur les transitions offensives.',
    previousClubs: ['FC Gobelins', 'Paris 13 Atletico'],
  },
  {
    id: 'ply_tahina',
    name: 'Tahina Rakotomalala',
    age: 23,
    city: 'Antananarivo',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&h=400&q=80',
    primaryPosition: 'Avant-centre',
    secondaryPosition: 'Ailier Droit',
    strongFoot: 'Gaucher',
    currentTeam: 'AS Analakely',
    currentTeamId: 'team_analakely',
    level: 'Régional',
    height: 181,
    weight: 75,
    appearances: 17,
    goals: 12,
    assists: 5,
    yellowCards: 2,
    rating: 8.0,
    isAvailableForTransfer: true,
    bio: 'Finisseur gaucher explosif, très à l\'aise dans le dos des défenses adverses.',
    previousClubs: ['Ajesaia Antananarivo'],
  },
  {
    id: 'ply_05',
    name: 'Enzo Ferrari',
    age: 21,
    city: 'Créteil',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&h=400&q=80',
    primaryPosition: 'Ailier Gauche',
    secondaryPosition: 'Ailier Droit',
    strongFoot: 'Droitier',
    currentTeam: 'FC Étoile Belleville',
    currentTeamId: 'team_01',
    level: 'Régional',
    height: 175,
    weight: 68,
    appearances: 17,
    goals: 8,
    assists: 9,
    yellowCards: 1,
    rating: 7.9,
    isAvailableForTransfer: false,
    bio: 'Ailier percutant, spécialiste du 1 contre 1 et des centres brossés.',
    previousClubs: ['US Créteil Lusitanos U19'],
  },
  {
    id: 'ply_03',
    name: 'Hugo Dupont',
    age: 24,
    city: 'Boulogne-Billancourt',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&h=400&q=80',
    primaryPosition: 'Gardien',
    strongFoot: 'Droitier',
    currentTeam: 'Sporting Club Parisien',
    currentTeamId: 'team_03',
    level: 'National',
    height: 191,
    weight: 84,
    appearances: 22,
    goals: 0,
    assists: 1,
    yellowCards: 1,
    rating: 7.6,
    isAvailableForTransfer: true,
    bio: 'Gardien moderne très rassurant sur sa ligne et efficace à la relance. 8 clean sheets cette saison.',
    previousClubs: ['Paris FC (Réserve)', 'AC Boulogne'],
  },
];

export const SEED_TEAMS: TeamSeed[] = [
  {
    id: 'team_betsileo',
    competitionId: 'championnat_r2_2026',
    ownerId: 'usr_me',
    name: 'Betsileo FC',
    shortName: 'BFC',
    city: 'Fianarantsoa',
    clubName: 'Betsileo Athlétique Club',
    clubId: 'club_betsileo',
    logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=128&h=128&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&h=320&q=80',
    category: 'Senior',
    division: 'Régional 2',
    coachName: 'Hery Rakoto',
    membersCount: 20,
    isRecruiting: true,
    recentForm: [],
    nextMatch: {
      id: 'match_betsileo_next',
      opponentName: 'AS Analakely',
      opponentLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=96&h=96&q=80',
      date: 'Samedi 24 Octobre',
      time: '15:30',
      venue: 'Stade Municipal de Fianarantsoa',
      competition: 'Championnat R2 — 18e Journée',
      isHome: true,
    },
    stats: {
      matchesPlayed: 16,
      wins: 7,
      draws: 4,
      losses: 5,
      goalsFor: 26,
      goalsAgainst: 21,
      points: 25,
      position: 4,
    },
    members: [
      {
        playerId: 'ply_02',
        name: 'Karim Benali',
        position: 'Avant-centre',
        jerseyNumber: 9,
        role: 'Capitaine',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
        age: 26,
        matchesPlayed: 16,
        goals: 12,
      },
      {
        playerId: 'usr_me',
        name: 'Alexandre Morel',
        position: 'Milieu Central',
        jerseyNumber: 8,
        role: 'Vice-Capitaine',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
        age: 25,
        matchesPlayed: 14,
        goals: 3,
      },
      {
        playerId: 'ply_b1',
        name: 'Andry Razafy',
        position: 'Gardien',
        jerseyNumber: 1,
        role: 'Gardien Titulaire',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
        age: 23,
        matchesPlayed: 16,
        goals: 0,
      },
    ],
  },
  {
    id: 'team_analakely',
    competitionId: 'championnat_r2_2026',
    name: 'AS Analakely',
    shortName: 'ASA',
    city: 'Antananarivo',
    clubName: 'Association Sportive Analakely',
    clubId: 'club_analakely',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=128&h=128&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&h=320&q=80',
    category: 'Senior',
    division: 'Régional 2',
    coachName: 'Jean-Claude Rasoanaivo',
    membersCount: 22,
    isRecruiting: false,
    recentForm: ['V'],
    nextMatch: {
      id: 'match_betsileo_next',
      opponentName: 'Betsileo FC',
      opponentLogo: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80',
      date: 'Samedi 24 Octobre',
      time: '15:30',
      venue: 'Stade Municipal de Fianarantsoa',
      competition: 'Championnat R2 — 18e Journée',
      isHome: false,
    },
    stats: {
      matchesPlayed: 16,
      wins: 11,
      draws: 3,
      losses: 2,
      goalsFor: 35,
      goalsAgainst: 14,
      points: 36,
      position: 1,
    },
    members: [
      {
        playerId: 'ply_mika',
        name: 'Mika Randrianasolo',
        position: 'Milieu Central',
        jerseyNumber: 10,
        role: 'Capitaine',
        avatarUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=256&h=256&q=80',
        age: 24,
        matchesPlayed: 16,
        goals: 11,
      },
    ],
  },
  {
    id: 'team_01',
    competitionId: 'championnat_r2_2026',
    name: 'FC Étoile Belleville',
    shortName: 'FCEB',
    city: 'Paris 20e',
    clubName: 'Club Étoile Belleville Omnisports',
    clubId: 'club_01',
    logoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=128&h=128&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&h=320&q=80',
    category: 'Senior',
    division: 'Régional 2',
    coachName: 'Didier Vasseur',
    membersCount: 22,
    isRecruiting: true,
    recentForm: ['D'],
    stats: {
      matchesPlayed: 16,
      wins: 10,
      draws: 4,
      losses: 2,
      goalsFor: 34,
      goalsAgainst: 15,
      points: 34,
      position: 2,
    },
    members: [
      {
        playerId: 'ply_05',
        name: 'Enzo Ferrari',
        position: 'Ailier Gauche',
        jerseyNumber: 7,
        role: 'Joueur',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80',
      },
    ],
  },
  {
    id: 'team_03',
    competitionId: 'championnat_r2_2026',
    name: 'Sporting Club Parisien',
    shortName: 'SCP',
    city: 'Paris 15e',
    clubName: 'Sporting Club de Paris',
    clubId: 'club_03',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=128&h=128&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&h=320&q=80',
    category: 'Senior',
    division: 'Régional 2',
    coachName: 'Marc Antoine',
    membersCount: 24,
    isRecruiting: true,
    recentForm: [],
    stats: {
      matchesPlayed: 16,
      wins: 9,
      draws: 3,
      losses: 4,
      goalsFor: 31,
      goalsAgainst: 19,
      points: 30,
      position: 3,
    },
    members: [
      {
        playerId: 'ply_03',
        name: 'Hugo Dupont',
        position: 'Gardien',
        jerseyNumber: 1,
        role: 'Gardien Titulaire',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
      },
    ],
  },
];

export const SEED_CLUBS = [
  {
    id: 'club_betsileo',
    name: 'Betsileo Athlétique Club',
    city: 'Fianarantsoa',
    stadiumName: 'Stade Municipal de Fianarantsoa',
    foundedYear: 1988,
    logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=128&h=128&q=80',
    teamsCount: 5,
    membersTotal: 180,
    presidentName: 'Hery Rakoto',
    teams: [{ id: 'team_betsileo', name: 'Betsileo FC Senior', category: 'Senior R2' }],
  },
  {
    id: 'club_analakely',
    name: 'Association Sportive Analakely',
    city: 'Antananarivo',
    stadiumName: 'Stade Municipal Mahamasina',
    foundedYear: 1995,
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=128&h=128&q=80',
    teamsCount: 6,
    membersTotal: 240,
    presidentName: 'Jean-Claude Rasoanaivo',
    teams: [{ id: 'team_analakely', name: 'AS Analakely Première', category: 'Senior R2' }],
  },
  {
    id: 'club_01',
    name: 'Club Étoile Belleville Omnisports',
    city: 'Paris 20e',
    stadiumName: 'Stade Déjerine',
    foundedYear: 1984,
    logoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=128&h=128&q=80',
    teamsCount: 8,
    membersTotal: 340,
    presidentName: 'Gérard Lemaitre',
    teams: [{ id: 'team_01', name: 'FC Étoile Belleville Senior A', category: 'Senior' }],
  },
];

export const SEED_MATCHES = [
  {
    id: 'match_01',
    tournamentId: 'championnat_r2_2026',
    homeTeam: {
      id: 'team_betsileo',
      name: 'Betsileo FC',
      logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80',
      score: 2,
    },
    awayTeam: {
      id: 'team_analakely',
      name: 'AS Analakely',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=96&h=96&q=80',
      score: 1,
    },
    status: 'LIVE',
    date: "Aujourd'hui",
    time: '20:00',
    minute: 74,
    venue: 'Stade Municipal, Fianarantsoa',
    city: 'Fianarantsoa',
    competition: 'Championnat R2 — 17e Journée',
    events: [
      { minute: 18, type: 'goal', teamId: 'team_betsileo', player: 'Karim Benali', assist: 'Alexandre Morel', description: 'Reprise du droit au ras du poteau' },
      { minute: 34, type: 'yellow_card', teamId: 'team_analakely', player: 'Mika Randrianasolo' },
      { minute: 52, type: 'goal', teamId: 'team_analakely', player: 'Mika Randrianasolo', description: 'Coup franc direct lucarne opposée' },
      { minute: 68, type: 'goal', teamId: 'team_betsileo', player: 'Faneva Solofo', description: 'Enroulé du gauche après une récupération haute' },
    ],
    stats: {
      possession: [54, 46],
      shots: [14, 9],
      shotsOnTarget: [8, 5],
      corners: [6, 4],
      fouls: [8, 10],
    },
  },
  {
    id: 'match_02',
    tournamentId: 'championnat_r2_2026',
    homeTeam: {
      id: 'team_01',
      name: 'FC Étoile Belleville',
      logoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=96&h=96&q=80',
      score: 0,
    },
    awayTeam: {
      id: 'team_03',
      name: 'Sporting Club Parisien',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=96&h=96&q=80',
      score: 0,
    },
    status: 'SCHEDULED',
    date: 'Samedi 24 Octobre',
    time: '18:00',
    venue: 'Stade Déjerine, Paris',
    city: 'Paris',
    competition: 'Championnat R2 — 18e Journée',
    events: [],
  },
  {
    id: 'match_betsileo_next',
    tournamentId: 'championnat_r2_2026',
    homeTeam: {
      id: 'team_betsileo',
      name: 'Betsileo FC',
      logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80',
      score: 0,
    },
    awayTeam: {
      id: 'team_analakely',
      name: 'AS Analakely',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=96&h=96&q=80',
      score: 0,
    },
    status: 'SCHEDULED',
    date: 'Samedi 24 Octobre',
    scheduledAt: '2026-10-24T15:30:00+03:00',
    time: '15:30',
    pitchId: 'pitch_01',
    venue: 'Stade Municipal de Fianarantsoa',
    pitchName: 'Terrain principal',
    city: 'Fianarantsoa',
    competition: 'Championnat R2 - 18e Journee',
    events: [],
  },
  {
    id: 'match_analakely_history',
    tournamentId: 'championnat_r2_2026',
    homeTeam: {
      id: 'team_analakely',
      name: 'AS Analakely',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=96&h=96&q=80',
      score: 3,
    },
    awayTeam: {
      id: 'team_01',
      name: 'FC Etoile Belleville',
      logoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=96&h=96&q=80',
      score: 1,
    },
    status: 'FINISHED',
    date: 'Dimanche 11 Octobre',
    playedAt: '2026-10-11T16:00:00+03:00',
    time: '16:00',
    pitchId: 'pitch_02',
    venue: 'Stade Mahamasina, Antananarivo',
    pitchName: 'Terrain central',
    city: 'Antananarivo',
    competition: 'Championnat R2 - 16e Journee',
    events: [
      { minute: 14, type: 'goal', teamId: 'team_analakely', playerId: 'ply_mika', player: 'Mika Randrianasolo' },
      { minute: 33, type: 'goal', teamId: 'team_01', player: 'Lucas Martin' },
      { minute: 58, type: 'goal', teamId: 'team_analakely', playerId: 'ply_mika', player: 'Mika Randrianasolo', assistPlayerId: 'ply_tahina', assist: 'Tahina Rakotomalala' },
      { minute: 81, type: 'goal', teamId: 'team_analakely', player: 'Fara Andrianina' },
    ],
  },
];

export const SEED_TOURNAMENTS = [
  {
    id: 'championnat_r2_2026',
    title: 'Championnat R2 2026',
    format: '11v11',
    city: 'Antananarivo & Fianarantsoa',
    venue: 'Stades régionaux',
    startDate: '01 Septembre 2026',
    endDate: '30 Juin 2027',
    maxTeams: 16,
    registeredTeams: 4,
    participantTeamIds: ['team_betsileo', 'team_analakely', 'team_01', 'team_03'],
    entryFee: 0,
    prizePool: 0,
    status: 'EN_COURS',
    bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&h=400&q=80',
    organizer: 'Ligue régionale Footera',
    standings: [],
    fixtures: [],
  },
  {
    id: 'tourn_01',
    title: 'Footera Grand Master Cup 2026',
    format: '11v11',
    city: 'Antananarivo & Grand Paris',
    venue: 'Stade Mahamasina & Complexes FFF',
    startDate: '14 Novembre 2026',
    endDate: '29 Novembre 2026',
    maxTeams: 16,
    registeredTeams: 2,
    participantTeamIds: ['team_analakely', 'team_betsileo'],
    entryFee: 150,
    prizePool: 3000,
    status: 'INSCRIPTIONS_OUVERTES',
    bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&h=400&q=80',
    organizer: 'Ligue Footera Internationale',
    standings: [],
    fixtures: [
      { round: '1/2 Finale', homeTeam: 'AS Analakely', awayTeam: 'Betsileo FC', date: '22 Nov', isFinished: false },
    ],
  },
];

export const SEED_PITCHES = [
  {
    id: 'pitch_01',
    name: 'Terrain d Honneur 11x11 Synthétique',
    complexName: 'Complexe Sportif Municipal',
    city: 'Fianarantsoa & Paris',
    address: 'Avenue du Sport, Fianarantsoa',
    surface: 'Synthétique dernière génération',
    dimensions: '105m x 68m (Homologué)',
    imageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&h=450&q=80',
    hourlyRate: 85,
    rating: 0,
    reviewsCount: 0,
    amenities: ['Vestiaires chauffés', 'Éclairage nocturne LED', 'Parking gratuit', 'Tribunes 500 places', 'Buvette'],
    availableSlots: [
      { id: 's1', time: '14:00 - 15:30', price: 125, isAvailable: true },
      { id: 's2', time: '16:00 - 17:30', price: 125, isAvailable: true },
      { id: 's4', time: '20:00 - 21:30', price: 150, isAvailable: true },
    ],
  },
  {
    id: 'pitch_02',
    name: 'Pitch Arena Five #3 (Indoor)',
    complexName: 'Urban Soccer Indoor Arena',
    city: 'Antananarivo',
    address: 'Zone Industrielle Akorondrano',
    surface: 'Indoor Five',
    dimensions: '32m x 19m avec palissades',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&h=450&q=80',
    hourlyRate: 70,
    rating: 0,
    reviewsCount: 0,
    amenities: ['Pelouse Five sans remplissage', 'Caméras vidéo HD replay', 'Club-House'],
    availableSlots: [
      { id: 's2_1', time: '18:00 - 19:00', price: 70, isAvailable: true },
      { id: 's2_2', time: '19:00 - 20:00', price: 80, isAvailable: true },
    ],
  },
];

export const SEED_BOOKINGS = [
  {
    id: 'bkg_01',
    userId: 'usr_me',
    pitchId: 'pitch_01',
    pitchName: 'Terrain d Honneur 11x11 Synthétique',
    complexName: 'Complexe Sportif Municipal',
    surface: 'Synthétique dernière génération',
    date: '2026-10-28',
    time: '20:00 - 21:30',
    durationMinutes: 90,
    totalPrice: 150,
    bookerName: 'Alexandre Morel',
    bookerPhone: '06 12 34 56 78',
    teamName: 'Betsileo FC',
    status: 'CONFIRMED',
    createdAt: '2026-10-20T14:30:00Z',
  },
];

export const SEED_RECRUITMENT_ADS = [
  {
    id: 'rec_01',
    teamId: 'team_betsileo',
    teamName: 'Betsileo FC',
    teamLogoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=96&h=96&q=80',
    clubName: 'Betsileo Athlétique Club',
    city: 'Fianarantsoa',
    positionSought: 'Défenseur Central',
    category: 'Senior Masculin',
    division: 'Régional 2',
    description: 'Betsileo FC renforce sa charnière centrale pour la seconde phase du championnat. Nous recherchons un défenseur athlétique, solide au duel et avec un bon sens de l anticipation.',
    requirements: ['Expérience de niveau régional', 'Assiduité aux 2 séances hebdomadaires (mardi/jeudi)', 'Esprit club et leadership'],
    createdAt: 'Il y a 2 jours',
    candidatesCount: 4,
    contactEmail: 'recrutement@betsileofc.mg',
  },
  {
    id: 'rec_02',
    teamId: 'team_analakely',
    teamName: 'AS Analakely',
    teamLogoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=96&h=96&q=80',
    clubName: 'AS Analakely',
    city: 'Antananarivo',
    positionSought: 'Ailier Droit',
    category: 'Senior Masculin',
    division: 'Régional 2',
    description: 'Recherche d un ailier rapide capable de faire des différences en 1 contre 1 et de délivrer des centres millimétrés.',
    requirements: ['Vitesse et explosivité', 'Disponibilité week-end'],
    createdAt: 'Il y a 4 jours',
    candidatesCount: 6,
    contactEmail: 'contact@asanalakely.mg',
  },
];

export const SEED_APPLICATIONS = [
  {
    id: 'app_01',
    userId: 'usr_me',
    adId: 'rec_01',
    adTitle: 'Défenseur Central R2 — Betsileo FC',
    teamName: 'Betsileo FC',
    applicantName: 'Alexandre Morel',
    applicantPosition: 'Milieu Central',
    phone: '06 12 34 56 78',
    message: 'Polyvalent au milieu et en défense centrale avec bonne relance. Disponible immédiatement pour une mise en place.',
    submittedAt: '2026-10-20T16:00:00Z',
    status: 'EN_REVUE',
  },
];

export const SEED_MARKETPLACE = [
  {
    id: 'mkt_01',
    title: 'Nike Mercurial Vapor 15 Elite FG (Taille 43)',
    category: 'Crampons',
    price: 135,
    condition: 'Très bon état',
    brand: 'Nike',
    size: '43 EU',
    city: 'Antananarivo / Paris',
    imageUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&h=450&q=80',
    sellerName: 'Karim B.',
    sellerRating: 4.9,
    description: 'Portées 3 fois sur pelouse naturelle. Crampons intacts, semelle Air Zoom ultra dynamique.',
    createdAt: 'Il y a 1 jour',
    isAvailable: true,
  },
  {
    id: 'mkt_02',
    title: 'Maillot Officiel Barea Madagascar 2026',
    category: 'Maillots',
    price: 65,
    condition: 'Neuf avec étiquette',
    brand: 'Garman Official',
    size: 'M',
    city: 'Antananarivo',
    imageUrl: 'https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=600&h=450&q=80',
    sellerName: 'Mika R.',
    sellerRating: 5.0,
    description: 'Maillot officiel vert et blanc avec blason brodé. Jamais porté.',
    createdAt: 'Il y a 2 jours',
    isAvailable: true,
  },
];

export const SEED_NOTIFICATIONS = [
  {
    id: 'notif_01',
    title: '⚽ But en direct !',
    message: 'Faneva Solofo marque à la 68e pour Betsileo FC (2 - 1).',
    time: 'Il y a 6 min',
    isRead: false,
    type: 'match',
    targetSection: 'matches',
    targetId: 'match_01',
  },
  {
    id: 'notif_02',
    title: 'Prochain match de votre équipe',
    message: 'Betsileo FC vs AS Analakely ce Samedi à 15h30. Convocations envoyées par le coach.',
    time: 'Il y a 1 heure',
    isRead: false,
    type: 'team',
    targetSection: 'teams',
    targetId: 'team_betsileo',
  },
  {
    id: 'notif_03',
    title: 'Candidature active en revue',
    message: 'Le coach Hery Rakoto examine votre candidature pour Betsileo FC.',
    time: 'Hier',
    isRead: false,
    type: 'recruitment',
    targetSection: 'recruitment',
    targetId: 'rec_01',
  },
];

export const SEED_ACTIVITY_FEED = [
  {
    id: 'act_1',
    type: 'match_result',
    title: 'Match en direct — 74e min',
    time: 'Il y a 4 min',
    description: 'FC Étoile Belleville mène 2 - 1 face à AS Montparnasse (But de Mikael Randria à la 68e).',
    badgeText: 'Live Score',
    targetSection: 'matches',
  },
  {
    id: 'act_2',
    type: 'new_player',
    title: 'Recrutement confirmé',
    time: 'Il y a 35 min',
    description: 'Andry Razafy a rejoint officiellement l’effectif de Betsileo FC au poste de gardien.',
    badgeText: 'Transfert',
    targetSection: 'teams',
  },
  {
    id: 'act_3',
    type: 'booking',
    title: 'Créneau validé',
    time: 'Il y a 2 heures',
    description: 'Réservation validée pour Complexe Suzanne Lenglen — Terrain Synthétique 11x11.',
    badgeText: 'Terrain',
    targetSection: 'pitches',
  },
];
