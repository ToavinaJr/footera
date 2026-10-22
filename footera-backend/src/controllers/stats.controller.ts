import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from '../modules/stats/stats.service.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('top-scorers')
  getTopScorers(
    @Query('tournamentId') tournamentId?: string,
    @Query('teamId') teamId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stats.topScorers({ tournamentId, teamId, limit: this.parseLimit(limit) });
  }

  @Get('top-assisters')
  getTopAssisters(
    @Query('tournamentId') tournamentId?: string,
    @Query('teamId') teamId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stats.topAssisters({ tournamentId, teamId, limit: this.parseLimit(limit) });
  }

  @Get('teams')
  getTeamStats(@Query('tournamentId') tournamentId?: string) {
    return this.stats.teamStats({ tournamentId });
  }

  @Get('players')
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
