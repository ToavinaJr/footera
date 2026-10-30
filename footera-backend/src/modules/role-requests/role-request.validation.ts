import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { ROLE_REQUESTABLE_ROLES, type RequestableRole } from '../../types/domain.js';
import { sanitizeMultilineText } from '../../utils/sanitize.utils.js';

export interface CreateRoleRequestInput {
  role: RequestableRole;
  reason?: string;
}

export class CreateRoleRequestPipe implements PipeTransform<unknown, CreateRoleRequestInput> {
  transform(value: unknown): CreateRoleRequestInput {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException('La demande de rôle est invalide.');
    }
    const input = value as Record<string, unknown>;
    if (Object.keys(input).some((key) => key !== 'role' && key !== 'reason')) {
      throw new BadRequestException('La demande contient des champs non autorisés.');
    }
    if (typeof input.role !== 'string' || !ROLE_REQUESTABLE_ROLES.includes(input.role as RequestableRole)) {
      throw new BadRequestException('Le rôle demandé est invalide.');
    }
    let reason: string | undefined;
    if (input.reason !== undefined) {
      if (typeof input.reason !== 'string' || input.reason.length > 1_000) {
        throw new BadRequestException('La justification ne peut pas dépasser 1 000 caractères.');
      }
      reason = sanitizeMultilineText(input.reason, 1_000) || undefined;
    }
    return { role: input.role as RequestableRole, ...(reason ? { reason } : {}) };
  }
}

export const createRoleRequestPipe = new CreateRoleRequestPipe();
