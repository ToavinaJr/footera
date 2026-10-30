import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { IS_PUBLIC_ROUTE } from './public.decorator.js';
import { normalizeOriginList, parseCookieValue } from '../../utils/text.utils.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; method: string; user?: { id: string; sessionId: string } }>();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.origin;
      const allowedOrigins = normalizeOriginList(process.env.FRONTEND_URL, 'http://localhost:3001');
      if (origin && !allowedOrigins.includes(origin.replace(/\/+$/, ''))) throw new ForbiddenException('Origine de requête non autorisée.');
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [context.getHandler(), context.getClass()]);
    const authorization = request.headers.authorization;
    const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const cookieToken = parseCookieValue(request.headers.cookie, 'footera_session');
    const token = bearer || cookieToken;
    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('Authentification requise.');
    }
    try {
      request.user = this.auth.verifyToken(decodeURIComponent(token));
      await this.auth.validateSession(request.user.id, request.user.sessionId);
    } catch (error: unknown) {
      request.user = undefined;
      if (isPublic) return true;
      throw error;
    }
    return true;
  }
}
