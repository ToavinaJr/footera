import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';
import type { ClubRecord, TeamRecord } from '../../database/domain-records.js';

@Injectable()
export class ClubsService {
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService) {}
  async list() {
    const [clubs, user, teams] = await Promise.all([
      this.records.list<ClubRecord>('clubs'),
      this.accounts.profile(),
      this.records.list<TeamRecord>('teams'),
    ]);
    const currentTeam = user?.roles?.includes('Entraîneur')
      ? teams.find((team) => team.name === user?.sportsCv?.currentTeam)
      : undefined;
    return clubs.map((club) => ({
      ...club,
      canManageLogo: Boolean(currentTeam && (club.teams || []).some((team) => team.id === currentTeam.id)),
    }));
  }

  async updateLogo(clubId: string, logoUrl: string) {
    const validatedLogoUrl = validateImageUrl(logoUrl, 'Logo du club');
    const [club, user, teams] = await Promise.all([
      this.records.find<ClubRecord>('clubs', clubId),
      this.accounts.profile(),
      this.records.list<TeamRecord>('teams'),
    ]);
    if (!club) throw new NotFoundException('Club introuvable.');
    if (!user?.roles?.includes('Entraîneur')) throw new ForbiddenException('Votre compte doit disposer du rôle Entraîneur pour modifier le logo du club.');
    const currentTeam = teams.find((team) => team.name === user?.sportsCv?.currentTeam);
    const canManage = currentTeam && (club.teams || []).some((team) => team.id === currentTeam.id);
    if (!canManage) throw new ForbiddenException('Vous ne pouvez modifier que le logo du club de votre équipe.');
    return this.records.save('clubs', clubId, { ...club, logoUrl: validatedLogoUrl });
  }
}
