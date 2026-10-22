import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';

@Injectable()
export class ClubsService {
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService) {}
  async list() {
    const [clubs, user, teams]: any[] = await Promise.all([
      this.records.list<any>('clubs'),
      this.accounts.profile(),
      this.records.list<any>('teams'),
    ]);
    const currentTeam = user?.roles?.includes('Entraîneur')
      ? teams.find((team: any) => team.name === user?.sportsCv?.currentTeam)
      : undefined;
    return clubs.map((club: any) => ({
      ...club,
      canManageLogo: Boolean(currentTeam && (club.teams || []).some((team: any) => team.id === currentTeam.id)),
    }));
  }

  async updateLogo(clubId: string, logoUrl: string) {
    const validatedLogoUrl = validateImageUrl(logoUrl, 'Logo du club');
    const [club, user, teams]: any[] = await Promise.all([
      this.records.find<any>('clubs', clubId),
      this.accounts.profile(),
      this.records.list<any>('teams'),
    ]);
    if (!club) throw new NotFoundException('Club introuvable.');
    if (!user?.roles?.includes('Entraîneur')) throw new ForbiddenException('Votre compte doit disposer du rôle Entraîneur pour modifier le logo du club.');
    const currentTeam = (teams as any[]).find((team: any) => team.name === user?.sportsCv?.currentTeam);
    const canManage = currentTeam && (club.teams || []).some((team: any) => team.id === currentTeam.id);
    if (!canManage) throw new ForbiddenException('Vous ne pouvez modifier que le logo du club de votre équipe.');
    return this.records.save('clubs', clubId, { ...club, logoUrl: validatedLogoUrl });
  }
}
