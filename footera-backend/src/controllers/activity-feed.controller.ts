import { Controller, Get } from '@nestjs/common';
import { MatchesService } from '../modules/matches/matches.service.js';
import { Public } from '../modules/auth/public.decorator.js';

@Controller('activity-feed')
export class ActivityFeedController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  @Public()
  list() {
    return this.matches.activityFeed();
  }
}
