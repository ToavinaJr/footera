import { isFiniteNumberInRange } from '../../utils/number.utils.js';
import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';

function isText(value: unknown, maxLength: number): boolean {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isAllowedImage(value: unknown): boolean {
  if (!isText(value, 2048)) return false;
  try {
    validateImageUrl(value, 'Photo du terrain');
    return true;
  } catch {
    return false;
  }
}

export const createPitchBodyPipe = new StrictObjectValidationPipe({
  fields: {
    name: { required: true, validate: (value) => isText(value, 120), message: 'Le nom du terrain est invalide.' },
    complexName: { required: true, validate: (value) => isText(value, 120), message: 'Le nom du complexe est invalide.' },
    city: { required: true, validate: (value) => isText(value, 100), message: 'La ville est invalide.' },
    address: { required: true, validate: (value) => isText(value, 200), message: 'L’adresse est invalide.' },
    surface: { required: true, validate: (value) => isText(value, 80), message: 'La surface est invalide.' },
    gameFormat: { required: true, validate: (value) => isText(value, 20), message: 'Le format du terrain est invalide.' },
    dimensions: { required: true, validate: (value) => isText(value, 80), message: 'Les dimensions sont invalides.' },
    imageUrl: { required: true, validate: isAllowedImage, message: 'La photo doit être un upload Footera ou une image HTTPS autorisée.' },
    hourlyRate: { required: true, validate: (value) => typeof value === 'number' && isFiniteNumberInRange(value, 5, 1_000_000), message: 'Le tarif par créneau est invalide.' },
    amenities: { required: true, validate: (value) => Array.isArray(value) && value.length <= 50 && value.every((item) => isText(item, 100)), message: 'La liste des équipements est invalide.' },
  },
});