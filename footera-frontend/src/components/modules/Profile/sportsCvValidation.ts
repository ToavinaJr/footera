import type { UserProfile } from '../../../types';

export type SportsCvErrors = Partial<Record<'primaryPosition' | 'strongFoot' | 'height' | 'weight' | 'currentTeam' | 'bio', string>>;

export const validateSportsCv = (
  value: Pick<UserProfile['sportsCv'], 'primaryPosition' | 'strongFoot' | 'height' | 'weight' | 'currentTeam' | 'bio'>,
  positions: string[],
  strongFeet: string[],
): SportsCvErrors => {
  const errors: SportsCvErrors = {};
  if (!positions.includes(value.primaryPosition)) errors.primaryPosition = 'Choisissez un poste valide.';
  if (!strongFeet.includes(value.strongFoot)) errors.strongFoot = 'Choisissez un pied fort valide.';
  if (!Number.isInteger(value.height) || value.height < 100 || value.height > 250) {
    errors.height = 'La taille doit être comprise entre 100 et 250 cm.';
  }
  if (!Number.isInteger(value.weight) || value.weight < 30 || value.weight > 250) {
    errors.weight = 'Le poids doit être compris entre 30 et 250 kg.';
  }
  if (value.currentTeam.trim().length > 80) errors.currentTeam = 'Le nom du club ne peut dépasser 80 caractères.';
  if (value.bio.trim().length > 1000) errors.bio = 'La présentation ne peut dépasser 1 000 caractères.';
  return errors;
};
