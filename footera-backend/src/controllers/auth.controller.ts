import { Controller, Get, Put, Post, Body, HttpCode, HttpStatus, Res, ForbiddenException, Req, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AccountsService } from '../modules/accounts/accounts.service.js';
import { SeedService } from '../database/seed.service.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { Public } from '../modules/auth/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly accounts: AccountsService, private readonly seeds: SeedService, private readonly auth: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { name?: unknown; email?: unknown; password?: unknown }, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(body);
    this.setSessionCookies(response, result.accessToken, result.refreshToken);
    return { user: await this.auth.getProfile(result.user.id) };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email?: unknown; password?: unknown }, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(body);
    this.setSessionCookies(response, result.accessToken, result.refreshToken);
    return { user: await this.auth.getProfile(result.user.id) };
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(this.readCookie(request, 'footera_refresh'));
    response.clearCookie('footera_session', this.accessCookieOptions());
    response.clearCookie('footera_refresh', this.refreshCookieOptions());
    return { success: true };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.readCookie(request, 'footera_refresh');
    if (!refreshToken) throw new UnauthorizedException('Session expirée. Veuillez vous reconnecter.');
    const result = await this.auth.refresh(refreshToken);
    this.setSessionCookies(response, result.accessToken, result.refreshToken);
    return { success: true };
  }

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
    if (process.env.NODE_ENV === 'production') throw new ForbiddenException('La réinitialisation des données de démonstration est désactivée en production.');
    await this.seeds.resetDemo();
    return { success: true, message: 'Données réinitialisées' };
  }

  private accessCookieOptions() {
    return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/v1' };
  }

  private refreshCookieOptions() {
    return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/v1/auth' };
  }

  private setSessionCookies(response: Response, accessToken: string, refreshToken: string) {
    response.cookie('footera_session', accessToken, { ...this.accessCookieOptions(), maxAge: 15 * 60 * 1000 });
    response.cookie('footera_refresh', refreshToken, { ...this.refreshCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private readCookie(request: Request, name: string) {
    const prefix = `${name}=`;
    const value = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length);
    return value ? decodeURIComponent(value) : undefined;
  }
}
