import { BadRequestException, type PipeTransform } from '@nestjs/common';

export interface ObjectFieldRule {
  required?: boolean;
  validate: (value: unknown) => boolean;
  message: string;
}

export interface StrictObjectSchema {
  fields: Readonly<Record<string, ObjectFieldRule>>;
  requireAtLeastOne?: boolean;
  validateObject?: (value: Readonly<Record<string, unknown>>) => string | undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export class StrictObjectValidationPipe implements PipeTransform {
  constructor(private readonly schema: StrictObjectSchema) {}

  transform(value: unknown): Record<string, unknown> {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Le corps de la requête doit être un objet JSON.');
    }

    const fields = Object.keys(this.schema.fields);
    const unknownFields = Object.keys(value).filter((field) => !fields.includes(field));
    if (unknownFields.length) {
      throw new BadRequestException(`Champ(s) non autorisé(s) : ${unknownFields.join(', ')}.`);
    }
    if (this.schema.requireAtLeastOne && Object.keys(value).length === 0) {
      throw new BadRequestException('Au moins un champ doit être fourni.');
    }

    for (const [field, rule] of Object.entries(this.schema.fields)) {
      if (!(field in value)) {
        if (rule.required) throw new BadRequestException(`${field} est obligatoire.`);
        continue;
      }
      if (!rule.validate(value[field])) throw new BadRequestException(rule.message);
    }
    const objectError = this.schema.validateObject?.(value);
    if (objectError) throw new BadRequestException(objectError);
    return value;
  }
}
