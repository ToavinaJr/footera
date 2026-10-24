import { isValidEmailAddress, isValidPhoneNumber } from '../../utils/text.utils.js';
import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

export const registerBodyPipe = new StrictObjectValidationPipe({
  fields: {
    name: { required: true, validate: (value) => typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 80, message: 'Le nom doit contenir entre 2 et 80 caractères.' },
    email: { required: true, validate: (value) => typeof value === 'string' && value.length <= 254 && isValidEmailAddress(value.trim()), message: 'Adresse e-mail invalide.' },
    password: { required: true, validate: (value) => typeof value === 'string' && value.length >= 12 && value.length <= 256, message: 'Le mot de passe doit contenir entre 12 et 256 caractères.' },
  },
});

export const loginBodyPipe = new StrictObjectValidationPipe({
  fields: {
    email: { required: true, validate: (value) => typeof value === 'string' && value.length <= 254 && isValidEmailAddress(value.trim()), message: 'Adresse e-mail invalide.' },
    password: { required: true, validate: (value) => typeof value === 'string' && value.length > 0 && value.length <= 256, message: 'Mot de passe invalide.' },
  },
});

export const profileBodyPipe = new StrictObjectValidationPipe({
  requireAtLeastOne: true,
  fields: {
    name: { validate: (value) => typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 80, message: 'Le nom doit contenir entre 2 et 80 caractères.' },
    phone: { validate: (value) => typeof value === 'string' && (!value.trim() || isValidPhoneNumber(value.trim())), message: 'Le numéro de téléphone est invalide.' },
    city: { validate: (value) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 160, message: 'La ville doit contenir entre 1 et 160 caractères.' },
    avatarUrl: { validate: (value) => typeof value === 'string' && value.length <= 2048, message: 'L’URL de la photo est invalide.' },
    dateOfBirth: { validate: (value) => typeof value === 'string' && value.length <= 10, message: 'La date de naissance est invalide.' },
  },
});
