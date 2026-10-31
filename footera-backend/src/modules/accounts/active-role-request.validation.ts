import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

export const switchActiveRoleBodyPipe = new StrictObjectValidationPipe({
  fields: {
    role: {
      required: true,
      validate: (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 80,
      message: 'Le rôle demandé est invalide.',
    },
  },
});
