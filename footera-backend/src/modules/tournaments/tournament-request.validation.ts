import { isFiniteNumberInRange, isIntegerInRange } from '../../utils/number.utils.js';
import { parseIsoDateOnly } from '../../utils/date.utils.js';
import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';

function isText(value: unknown, maxLength: number, minLength = 1): value is string {
  return typeof value === 'string' && value.trim().length >= minLength && value.trim().length <= maxLength;
}

function isAllowedImage(value: unknown): boolean {
  if (!isText(value, 2048)) return false;
  try {
    validateImageUrl(value, 'Image du tournoi');
    return true;
  } catch {
    return false;
  }
}

export const createTournamentBodyPipe = new StrictObjectValidationPipe({
  fields: {
    title: { required: true, validate: (value) => isText(value, 120), message: 'Le nom du tournoi est invalide.' },
    format: { required: true, validate: (value) => isText(value, 80), message: 'Le format du tournoi est invalide.' },
    city: { required: true, validate: (value) => isText(value, 100), message: 'La ville est invalide.' },
    venue: { required: true, validate: (value) => isText(value, 200), message: 'Le stade est invalide.' },
    startDate: { required: true, validate: (value) => typeof value === 'string' && Boolean(parseIsoDateOnly(value)), message: 'La date de début doit être au format AAAA-MM-JJ.' },
    endDate: { required: true, validate: (value) => typeof value === 'string' && Boolean(parseIsoDateOnly(value)), message: 'La date de fin doit être au format AAAA-MM-JJ.' },
    maxTeams: { required: true, validate: (value) => typeof value === 'number' && isIntegerInRange(value, 2, 128), message: 'Le tournoi doit accepter entre 2 et 128 équipes.' },
    entryFee: { required: true, validate: (value) => typeof value === 'number' && isFiniteNumberInRange(value, 0, 1_000_000_000), message: 'Les frais d’inscription sont invalides.' },
    prizePool: { required: true, validate: (value) => typeof value === 'number' && isFiniteNumberInRange(value, 0, 1_000_000_000), message: 'La dotation est invalide.' },
    bannerUrl: { required: true, validate: isAllowedImage, message: 'L’image du tournoi doit être un upload Footera ou une image HTTPS autorisée.' },
    organizer: { required: true, validate: (value) => isText(value, 120), message: 'Le nom de l’organisateur est invalide.' },
  },
  validateObject: (value) => {
    const start = typeof value.startDate === 'string' ? parseIsoDateOnly(value.startDate) : undefined;
    const end = typeof value.endDate === 'string' ? parseIsoDateOnly(value.endDate) : undefined;
    return start && end && end < start ? 'La date de fin doit être égale ou postérieure à la date de début.' : undefined;
  },
});

export const registerTournamentTeamBodyPipe = new StrictObjectValidationPipe({
  fields: {
    teamId: { required: true, validate: (value) => isText(value, 128), message: 'Identifiant d’équipe invalide.' },
  },
});
