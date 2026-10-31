import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

export const ratePitchBodyPipe = new StrictObjectValidationPipe({
  fields: {
    rating: {
      required: true,
      validate: (value) => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5,
      message: 'La note doit être un nombre entier compris entre 1 et 5.',
    },
    comment: {
      validate: (value) => typeof value === 'string' && value.length <= 500,
      message: 'Le commentaire ne doit pas dépasser 500 caractères.',
    },
  },
});
