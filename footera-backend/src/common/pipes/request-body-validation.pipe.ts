import { BadRequestException, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';

const MAX_BODY_DEPTH = 12;
const MAX_OBJECT_PROPERTIES = 200;
const MAX_ARRAY_ITEMS = 200;
const MAX_STRING_LENGTH = 20_000;
const MAX_BODY_NODES = 2_000;
const UNSAFE_PROPERTY_NAMES = new Set(['__proto__', 'prototype', 'constructor']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateRequestBody(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new BadRequestException('Le corps de la requête doit être un objet JSON.');
  }

  let visitedNodes = 0;
  const inspect = (current: unknown, depth: number): void => {
    visitedNodes += 1;
    if (visitedNodes > MAX_BODY_NODES || depth > MAX_BODY_DEPTH) {
      throw new BadRequestException('Le corps de la requête est trop complexe.');
    }
    if (typeof current === 'string' && current.length > MAX_STRING_LENGTH) {
      throw new BadRequestException('Une valeur du corps de la requête est trop longue.');
    }
    if (typeof current === 'number' && !Number.isFinite(current)) {
      throw new BadRequestException('Le corps de la requête contient un nombre invalide.');
    }
    if (Array.isArray(current)) {
      if (current.length > MAX_ARRAY_ITEMS) {
        throw new BadRequestException('Une liste du corps de la requête contient trop d’éléments.');
      }
      current.forEach((item) => inspect(item, depth + 1));
      return;
    }
    if (isPlainObject(current)) {
      const entries = Object.entries(current);
      if (entries.length > MAX_OBJECT_PROPERTIES) {
        throw new BadRequestException('Un objet du corps de la requête contient trop de propriétés.');
      }
      for (const [key, item] of entries) {
        if (UNSAFE_PROPERTY_NAMES.has(key)) {
          throw new BadRequestException('Le corps de la requête contient une propriété interdite.');
        }
        inspect(item, depth + 1);
      }
    }
  };

  inspect(value, 0);
  return value;
}

export class RequestBodyValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // @Body('field') intentionally extracts scalar values; validate complete JSON bodies only.
    if (metadata.type !== 'body' || metadata.data !== undefined || value === undefined) return value;
    return validateRequestBody(value);
  }
}
