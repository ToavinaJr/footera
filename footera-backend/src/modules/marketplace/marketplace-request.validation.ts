import { isFiniteNumberInRange } from '../../utils/number.utils.js';
import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';

function isText(value: unknown, maxLength: number, minLength = 1): value is string {
  return typeof value === 'string' && value.trim().length >= minLength && value.trim().length <= maxLength;
}

function isAllowedImage(value: unknown): boolean {
  if (!isText(value, 2048)) return false;
  try {
    validateImageUrl(value, 'Photo de l’article');
    return true;
  } catch {
    return false;
  }
}

export const createMarketplaceBodyPipe = new StrictObjectValidationPipe({
  fields: {
    title: { required: true, validate: (value) => isText(value, 120), message: 'Le titre de l’annonce est invalide.' },
    category: { required: true, validate: (value) => isText(value, 80), message: 'La catégorie est invalide.' },
    condition: { required: true, validate: (value) => isText(value, 80), message: 'L’état de l’article est invalide.' },
    brand: { required: true, validate: (value) => isText(value, 80), message: 'La marque est invalide.' },
    price: { required: true, validate: (value) => typeof value === 'number' && value > 0 && isFiniteNumberInRange(value, 0, 1_000_000_000), message: 'Le prix doit être un montant positif valide.' },
    imageUrl: { required: true, validate: isAllowedImage, message: 'L’image doit être un upload Footera ou une image HTTPS autorisée.' },
    city: { required: true, validate: (value) => isText(value, 160), message: 'La ville est invalide.' },
    description: { required: true, validate: (value) => typeof value === 'string' && value.trim().length <= 2000, message: 'La description ne peut pas dépasser 2 000 caractères.' },
    size: { validate: (value) => typeof value === 'string' && value.length <= 40, message: 'La taille ne peut pas dépasser 40 caractères.' },
  },
});
