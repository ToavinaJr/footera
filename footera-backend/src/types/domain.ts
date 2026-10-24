export const MATCH_STATUSES = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
} as const;
export type MatchStatus = (typeof MATCH_STATUSES)[keyof typeof MATCH_STATUSES];

export const MATCH_EVENT_TYPES = {
  GOAL: 'goal',
  PENALTY: 'penalty',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'sub',
} as const;
export type MatchEventType = (typeof MATCH_EVENT_TYPES)[keyof typeof MATCH_EVENT_TYPES];

export const TOURNAMENT_STATUSES = {
  REGISTRATION_OPEN: 'INSCRIPTIONS_OUVERTES',
  IN_PROGRESS: 'EN_COURS',
} as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[keyof typeof TOURNAMENT_STATUSES];

export const BOOKING_STATUSES = { CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED' } as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[keyof typeof BOOKING_STATUSES];

export const APPLICATION_STATUSES = { IN_REVIEW: 'EN_REVUE' } as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[keyof typeof APPLICATION_STATUSES];

export const TEAM_INVITATION_STATUSES = { PENDING: 'PENDING', ACCEPTED: 'ACCEPTED', DECLINED: 'DECLINED' } as const;
export type TeamInvitationStatus = (typeof TEAM_INVITATION_STATUSES)[keyof typeof TEAM_INVITATION_STATUSES];

export const TEAM_JOIN_REQUEST_STATUSES = {
  PENDING: 'PENDING', ACCEPTED: 'ACCEPTED', DECLINED: 'DECLINED',
} as const;
export type TeamJoinRequestStatus = (typeof TEAM_JOIN_REQUEST_STATUSES)[keyof typeof TEAM_JOIN_REQUEST_STATUSES];

export const NOTIFICATION_TYPES = {
  MATCH: 'match', TEAM: 'team', RECRUITMENT: 'recruitment', MARKETPLACE: 'marketplace', BOOKING: 'booking', SYSTEM: 'system',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const APP_SECTIONS = {
  MATCHES: 'matches', TEAMS: 'teams', RECRUITMENT: 'recruitment', MARKETPLACE: 'marketplace',
  BOOKINGS: 'bookings', PITCHES: 'pitches', TOURNAMENTS: 'tournaments',
} as const;
export type AppSection = (typeof APP_SECTIONS)[keyof typeof APP_SECTIONS];
