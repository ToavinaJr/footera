import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isBoundedText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isBookingSelection(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.length === 2
    && keys.includes('date')
    && keys.includes('time')
    && isBoundedText(value.date, 80)
    && isBoundedText(value.time, 40);
}

function isSelections(value: unknown): boolean {
  return Array.isArray(value)
    && value.length >= 1
    && value.length <= 30
    && value.every(isBookingSelection);
}

const sharedBatchFields = {
  pitchId: { required: true, validate: (value: unknown) => isBoundedText(value, 128), message: 'Identifiant du terrain invalide.' },
  selections: { required: true, validate: isSelections, message: 'La sélection doit contenir de 1 à 30 créneaux valides.' },
};

export const quoteBookingsBodyPipe = new StrictObjectValidationPipe({ fields: sharedBatchFields });

export const createBookingBatchBodyPipe = new StrictObjectValidationPipe({
  fields: {
    ...sharedBatchFields,
    teamName: { validate: (value: unknown) => typeof value === 'string' && value.length <= 100, message: 'Le nom d’équipe ne peut pas dépasser 100 caractères.' },
  },
});

export const createBookingBodyPipe = new StrictObjectValidationPipe({
  fields: {
    pitchId: { required: true, validate: (value: unknown) => isBoundedText(value, 128), message: 'Identifiant du terrain invalide.' },
    date: { required: true, validate: (value: unknown) => isBoundedText(value, 80), message: 'Date de réservation invalide.' },
    time: { required: true, validate: (value: unknown) => isBoundedText(value, 40), message: 'Horaire de réservation invalide.' },
    teamName: { validate: (value: unknown) => typeof value === 'string' && value.length <= 100, message: 'Le nom d’équipe ne peut pas dépasser 100 caractères.' },
  },
});
