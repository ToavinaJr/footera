import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from '../modules/stats/stats.service.js';
import { Public } from '../modules/auth/public.decorator.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('top-scorers')
  @Public()
  getTopScorers(
    @Query('tournamentId') tournamentId?: string,
    @Query('teamId') teamId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stats.topScorers({ tournamentId, teamId, limit: this.parseLimit(limit) });
  }

  @Get('top-assisters')
  @Public()
  getTopAssisters(
    @Query('tournamentId') tournamentId?: string,
    @Query('teamId') teamId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stats.topAssisters({ tournamentId, teamId, limit: this.parseLimit(limit) });
  }

  @Get('teams')
  @Public()
  getTeamStats(@Query('tournamentId') tournamentId?: string) {
    return this.stats.teamStats({ tournamentId });
  }

  @Get('players')
  @Public()
  getPlayerStats(
    @Query('teamId') teamId?: string,
    @Query('position') position?: string,
    @Query('searchQuery') searchQuery?: string,
  ) {
    return this.stats.playerStats({ teamId, position, searchQuery });
  }

  private parseLimit(value?: string): number | undefined {
    if (!value) return undefined;
    const limit = Number.parseInt(value, 10);
    return Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : undefined;
  }
}
