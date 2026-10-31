import { StrictObjectValidationPipe } from '../../common/pipes/strict-object-validation.pipe.js';

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export const joinTeamBodyPipe = new StrictObjectValidationPipe({
  fields: {
    message: { required: true, validate: (value) => isText(value, 500), message: 'Le message doit contenir entre 1 et 500 caractères.' },
    position: { required: true, validate: (value) => isText(value, 100), message: 'Le poste doit contenir entre 1 et 100 caractères.' },
  },
});

export const updateTeamJoinRequestBodyPipe = new StrictObjectValidationPipe({
  fields: {
    message: { required: true, validate: (value) => isText(value, 500), message: 'Le message doit contenir entre 1 et 500 caractères.' },
    position: { required: true, validate: (value) => isText(value, 100), message: 'Le poste doit contenir entre 1 et 100 caractères.' },
  },
});

export const remindTeamMembersBodyPipe = new StrictObjectValidationPipe({
  fields: {
    message: { required: true, validate: (value) => isText(value, 1000), message: 'Le message doit contenir entre 1 et 1 000 caractères.' },
  },
});
