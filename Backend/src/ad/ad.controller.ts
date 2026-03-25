import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { AdService } from './ad.service';

@Controller('ads')
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Get('active')
  async getActive(@Query('placement') placement?: string) {
    return this.adService.getActiveAds(placement);
  }

  @Post('track/impression/:id')
  async impression(@Param('id') id: string) {
    return this.adService.trackImpression(id);
  }

  @Post('track/click/:id')
  async click(@Param('id') id: string) {
    return this.adService.trackClick(id);
  }
}
