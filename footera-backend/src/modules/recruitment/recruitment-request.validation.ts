import { isValidPhoneNumber } from '../../utils/text.utils.js';
import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

export const applyRecruitmentBodyPipe = new StrictObjectValidationPipe({
  fields: {
    message: { required: true, validate: (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 2000, message: 'Le message est obligatoire et limité à 2 000 caractères.' },
    phone: { required: true, validate: (value) => typeof value === 'string' && value.length <= 32 && (!value.trim() || isValidPhoneNumber(value.trim())), message: 'Le numéro de téléphone est invalide.' },
  },
});
