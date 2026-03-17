import { Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('scrape/trigger')
  async triggerScrape() {
    return await this.appService.triggerScrapeAll();
  }

  @Get('articles')
  async getArticles(@Query('category') category?: string) {
    return await this.appService.getPublicArticles(category);
  }
}
