import { Body, Controller, Get, Post } from '@nestjs/common';
import { createRoleRequestPipe, type CreateRoleRequestInput } from '../modules/role-requests/role-request.validation.js';
import { RoleRequestsService } from '../modules/role-requests/role-requests.service.js';

@Controller('role-requests')
export class RoleRequestsController {
  constructor(private readonly roleRequests: RoleRequestsService) {}

  @Get()
  listMine() {
    return this.roleRequests.listMine();
  }

  @Post()
  create(@Body(createRoleRequestPipe) body: CreateRoleRequestInput) {
    return this.roleRequests.create(body);
  }
}
