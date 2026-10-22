import { Controller, Get } from '@nestjs/common';
import { MatchesService } from '../modules/matches/matches.service.js';

@Controller('activity-feed')
export class ActivityFeedController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list() {
    return this.matches.activityFeed();
  }
}
