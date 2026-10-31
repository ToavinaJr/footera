import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

export const addMarketplaceBrandBodyPipe = new StrictObjectValidationPipe({
  fields: {
    brand: {
      required: true,
      validate: (value) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 80,
      message: 'Le nom de marque doit contenir entre 1 et 80 caractères.',
    },
  },
});
