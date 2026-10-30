import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function executionContext(request: Record<string, unknown>, isPublic = false) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => 'handler',
    getClass: () => 'class',
    reflector: { getAllAndOverride: vi.fn(() => isPublic) },
  } as unknown as { switchToHttp: () => { getRequest: () => unknown }; getHandler: () => unknown; getClass: () => unknown };
}

function createGuard(isPublic = false) {
  const reflector = { getAllAndOverride: vi.fn(() => isPublic) };
  const auth = {
    verifyToken: vi.fn(() => ({ id: 'user-1', sessionId: 'session-1' })),
    validateSession: vi.fn(async () => true),
  };
  return { guard: new JwtAuthGuard(reflector as never, auth as never), auth };
}

describe('JwtAuthGuard', () => {
  it('allows mutating requests from the production Vercel frontend', async () => {
    const { guard } = createGuard(true);
    const request = { method: 'POST', headers: { origin: 'https://footera-frontend.vercel.app' } };

    await expect(guard.canActivate(executionContext(request, true))).resolves.toBe(true);
  });

  it('rejects mutating requests from an unknown origin', async () => {
    const { guard } = createGuard(true);
    const request = { method: 'POST', headers: { origin: 'https://attacker.example' } };

    await expect(guard.canActivate(executionContext(request, true))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows public requests without a session', async () => {
    const { guard } = createGuard(true);
    const request = { method: 'GET', headers: {} };

    await expect(guard.canActivate(executionContext(request, true))).resolves.toBe(true);
  });

  it('rejects protected requests without a session', async () => {
    const { guard } = createGuard(false);
    const request = { method: 'GET', headers: {} };

    await expect(guard.canActivate(executionContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validates a bearer token before allowing a protected request', async () => {
    const { guard, auth } = createGuard(false);
    const request = { method: 'GET', headers: { authorization: 'Bearer token' } };

    await expect(guard.canActivate(executionContext(request))).resolves.toBe(true);
    expect(auth.verifyToken).toHaveBeenCalledWith('token');
    expect(auth.validateSession).toHaveBeenCalledWith('user-1', 'session-1');
  });
});
