import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ClubsService } from './clubs.service.js';

function makeService(activeRole = 'Entraîneur', currentTeam = 'Betsileo FC', roles = ['Entraîneur']) {
  const club = { id: 'club_betsileo', logoUrl: '/old.png', teams: [{ id: 'team_betsileo' }] };
  const repository = {
    list: vi.fn(async () => [{ id: 'team_betsileo', name: 'Betsileo FC' }]),
    find: vi.fn(async () => club),
    save: vi.fn(async (_table, _id, payload) => payload),
  };
  const accounts = { profile: vi.fn(async () => ({ activeRole, roles, sportsCv: { currentTeam } })) };
  return { service: new ClubsService(repository as unknown as never, accounts as unknown as never), repository };
}

describe('ClubsService logo security', () => {
  const safeLogoUrl = '/api/v1/uploads/8c82b450-a0fa-4fe1-a431-e8f98d483caa.png';

  it('accepts only a Footera upload URL for a coach linked to that club', async () => {
    const { service, repository } = makeService();
    await expect(service.updateLogo('club_betsileo', safeLogoUrl)).resolves.toMatchObject({ logoUrl: safeLogoUrl });
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('allows the action when the coach role is assigned, even if another mode is active', async () => {
    const { service, repository } = makeService('Joueur', 'Betsileo FC', ['Joueur', 'Entraîneur']);
    await expect(service.updateLogo('club_betsileo', safeLogoUrl)).resolves.toMatchObject({ logoUrl: safeLogoUrl });
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('rejects remote URLs and javascript URLs', async () => {
    const { service } = makeService();
    await expect(service.updateLogo('club_betsileo', 'https://evil.example/logo.png')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.updateLogo('club_betsileo', 'javascript:alert(1)')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects users without the coach role or without a team association', async () => {
    const nonCoach = makeService('Joueur', 'Betsileo FC', ['Joueur']);
    await expect(nonCoach.service.updateLogo('club_betsileo', safeLogoUrl)).rejects.toBeInstanceOf(ForbiddenException);
    const otherTeam = makeService('Entraîneur', 'Other FC');
    await expect(otherTeam.service.updateLogo('club_betsileo', safeLogoUrl)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
