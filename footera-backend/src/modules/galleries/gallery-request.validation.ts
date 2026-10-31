import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

function isImageUrl(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 2048;
}

const imageUrlRule = {
  required: true,
  validate: isImageUrl,
  message: 'URL de photo invalide.',
};

export const addGalleryImageBodyPipe = new StrictObjectValidationPipe({
  fields: { imageUrl: imageUrlRule },
});

export const replaceGalleryImageBodyPipe = new StrictObjectValidationPipe({
  fields: {
    previousImageUrl: { ...imageUrlRule, message: 'URL de la photo précédente invalide.' },
    imageUrl: imageUrlRule,
  },
});

export const removeGalleryImageBodyPipe = new StrictObjectValidationPipe({
  fields: { imageUrl: imageUrlRule },
});
