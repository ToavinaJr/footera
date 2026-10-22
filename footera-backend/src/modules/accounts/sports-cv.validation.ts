import { BadRequestException } from '@nestjs/common';

const POSITIONS = new Set([
  'Gardien', 'Défenseur Central', 'Latéral Droit', 'Latéral Gauche', 'Milieu Défensif',
  'Milieu Central', 'Milieu Offensif', 'Ailier Droit', 'Ailier Gauche', 'Avant-centre',
]);
const STRONG_FEET = new Set(['Droitier', 'Gaucher', 'Ambidextre']);
const ALLOWED_FIELDS = new Set([
  'primaryPosition', 'secondaryPosition', 'strongFoot', 'height', 'weight',
  'experienceYears', 'preferredNumber', 'currentTeam', 'bio',
]);

type SportsCvUpdate = Record<string, string | number | null>;

export function validateSportsCvPayload(input: unknown): SportsCvUpdate {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BadRequestException('Le CV sportif doit être un objet JSON.');
  }

  const body = input as Record<string, unknown>;
  const unknownFields = Object.keys(body).filter((field) => !ALLOWED_FIELDS.has(field));
  if (unknownFields.length) {
    throw new BadRequestException(`Champ(s) non autorisé(s) : ${unknownFields.join(', ')}.`);
  }

  const value: SportsCvUpdate = {};
  if ('primaryPosition' in body) {
    if (typeof body.primaryPosition !== 'string' || !POSITIONS.has(body.primaryPosition)) {
      throw new BadRequestException('Le poste principal est invalide.');
    }
    value.primaryPosition = body.primaryPosition;
  }
  if ('secondaryPosition' in body) {
    if (body.secondaryPosition !== null && body.secondaryPosition !== ''
      && (typeof body.secondaryPosition !== 'string' || !POSITIONS.has(body.secondaryPosition))) {
      throw new BadRequestException('Le poste secondaire est invalide.');
    }
    value.secondaryPosition = body.secondaryPosition as string | null;
  }
  if ('strongFoot' in body) {
    if (typeof body.strongFoot !== 'string' || !STRONG_FEET.has(body.strongFoot)) {
      throw new BadRequestException('Le pied fort est invalide.');
    }
    value.strongFoot = body.strongFoot;
  }

  for (const [field, min, max] of [
    ['height', 100, 250], ['weight', 30, 250], ['experienceYears', 0, 70], ['preferredNumber', 1, 99],
  ] as const) {
    if (!(field in body)) continue;
    const numericValue = body[field];
    if (typeof numericValue !== 'number' || !Number.isInteger(numericValue) || numericValue < min || numericValue > max) {
      throw new BadRequestException(`${field} doit être un entier compris entre ${min} et ${max}.`);
    }
    value[field] = numericValue;
  }

  for (const [field, maxLength] of [['currentTeam', 80], ['bio', 1000]] as const) {
    if (!(field in body)) continue;
    const text = body[field];
    if (typeof text !== 'string' || text.trim().length > maxLength) {
      throw new BadRequestException(`${field} doit être du texte de ${maxLength} caractères maximum.`);
    }
    value[field] = text.trim();
  }

  if (!Object.keys(value).length) throw new BadRequestException('Aucune donnée de CV à modifier.');
  return value;
}
