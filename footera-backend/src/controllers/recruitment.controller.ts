import { Controller, Get, Param, Query, Post, Body, NotFoundException } from '@nestjs/common';
import { RecruitmentService } from '../modules/recruitment/recruitment.service.js';
import { Public } from '../modules/auth/public.decorator.js';
import { applyRecruitmentBodyPipe } from '../modules/recruitment/recruitment-request.validation.js';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitment: RecruitmentService) {}

  @Get('ads')
  @Public()
  listAds(@Query('q') query?: string, @Query('position') position?: string, @Query('division') division?: string) {
    return this.recruitment.listAds({ query, position, division });
  }

  @Get('ads/available')
  listAvailableAds(@Query('q') query?: string, @Query('position') position?: string, @Query('division') division?: string) {
    return this.recruitment.listAvailableAds({ query, position, division });
  }

  @Get('ads/:id')
  @Public()
  async getAdById(@Param('id') id: string) {
    const ad = await this.recruitment.getAd(id);
    if (!ad) throw new NotFoundException('Annonce introuvable');
    return ad;
  }

  @Post('ads/:id/apply')
  apply(
    @Param('id') id: string,
    @Body(applyRecruitmentBodyPipe) body: { message: string; phone: string },
  ) {
    return this.recruitment.apply(id, body);
  }

  @Get('my-applications')
  getMyApplications() {
    return this.recruitment.listApplications();
  }

  @Post('my-applications/:id/cancel')
  cancelMyApplication(@Param('id') id: string) {
    return this.recruitment.cancelApplication(id);
  }
}
