import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RecordRepository } from '../../database/record.repository.js';
import { ROLE_REQUESTABLE_ROLES, ROLE_REQUEST_STATUSES } from '../../types/domain.js';
import type { RoleRequestRecord } from '../../types/records.js';
import { AccountsService } from '../accounts/accounts.service.js';
import type { CreateRoleRequestInput } from './role-request.validation.js';

@Injectable()
export class RoleRequestsService {
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService) {}

  async listMine() {
    const user = await this.requireUser();
    const requests = (await this.records.list<RoleRequestRecord>('roleRequests'))
      .filter((request) => request.userId === user.id)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    const pendingRoles = new Set(requests
      .filter((request) => request.status === ROLE_REQUEST_STATUSES.PENDING)
      .map((request) => request.role));
    return {
      availableRoles: ROLE_REQUESTABLE_ROLES.filter((role) => !user.roles?.includes(role) && !pendingRoles.has(role)),
      requests,
    };
  }

  async create(input: CreateRoleRequestInput) {
    const user = await this.requireUser();
    if (user.roles?.includes(input.role)) throw new ConflictException('Ce rôle est déjà associé à votre compte.');
    const existingRequests = await this.records.list<RoleRequestRecord>('roleRequests');
    if (existingRequests.some((request) => request.userId === user.id
      && request.role === input.role && request.status === ROLE_REQUEST_STATUSES.PENDING)) {
      throw new ConflictException('Une demande pour ce rôle est déjà en attente.');
    }
    const request: RoleRequestRecord = {
      id: randomUUID(), userId: user.id, role: input.role,
      status: ROLE_REQUEST_STATUSES.PENDING,
      ...(input.reason ? { reason: input.reason } : {}),
      createdAt: new Date().toISOString(),
    };
    await this.records.create('roleRequests', request.id, request);
    return request;
  }

  async cancel(id: string) {
    const user = await this.requireUser();
    const request = await this.records.find<RoleRequestRecord>('roleRequests', id);
    if (!request || request.userId !== user.id) throw new NotFoundException('Demande introuvable.');
    if (request.status !== ROLE_REQUEST_STATUSES.PENDING) {
      throw new ConflictException('Seules les demandes en attente peuvent être annulées.');
    }
    await this.records.deleteOne('roleRequests', id);
    return this.listMine();
  }

  private async requireUser() {
    const user = await this.accounts.profile();
    if (!user) throw new UnauthorizedException('Utilisateur introuvable.');
    return user;
  }
}
