import { Controller, Get, Module } from '@nestjs/common';
import { AuthenticationModule } from '../auth/authentication.module.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get()
  get() { return this.dashboard.get(); }
}

@Module({ imports: [AuthenticationModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
