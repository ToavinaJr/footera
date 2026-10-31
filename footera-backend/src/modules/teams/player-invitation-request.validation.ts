import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

export const invitePlayerBodyPipe = new StrictObjectValidationPipe({
  fields: {
    message: {
      validate: (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 500,
      message: 'Le message doit contenir entre 1 et 500 caractères.',
    },
  },
});
