import { Controller, Get, Put, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AccountsService } from '../modules/accounts/accounts.service.js';
import { SeedService } from '../database/seed.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly accounts: AccountsService, private readonly seeds: SeedService) {}

  @Get('me')
  getMe() {
    return this.accounts.profile();
  }

  @Put('profile')
  updateProfile(@Body() body: Record<string, unknown>) {
    return this.accounts.updateProfile(body);
  }

  @Put('sports-cv')
  updateSportsCv(@Body() body: unknown) {
    return this.accounts.updateSportsCv(body);
  }

  @Post('role')
  @HttpCode(HttpStatus.OK)
  switchRole(@Body('role') role: string) {
    return this.accounts.setActiveRole(role);
  }

  @Post('reset-demo')
  @HttpCode(HttpStatus.OK)
  async resetDemo() {
    await this.seeds.resetDemo();
    return { success: true, message: 'Données réinitialisées' };
  }
}
