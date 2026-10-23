import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { IS_PUBLIC_ROUTE } from './public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; method: string; user?: { id: string; sessionId: string } }>();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.origin;
      const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',').map((value) => value.trim().replace(/\/+$/, ''));
      if (origin && !allowedOrigins.includes(origin.replace(/\/+$/, ''))) throw new ForbiddenException('Origine de requête non autorisée.');
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    const authorization = request.headers.authorization;
    const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const cookieToken = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('footera_session='))?.slice('footera_session='.length);
    const token = bearer || cookieToken;
    if (!token) throw new UnauthorizedException('Authentification requise.');
    request.user = this.auth.verifyToken(decodeURIComponent(token));
    await this.auth.validateSession(request.user.id, request.user.sessionId);
    return true;
  }
}
