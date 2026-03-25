import { Controller, Get, Post, Query, Param } from '@nestjs/common';
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
  async getArticles(
    @Query('category') category?: string,
    @Query('q') query?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return await this.appService.getPublicArticles(
      category,
      query,
      skip ? parseInt(skip) : undefined,
      take ? parseInt(take) : undefined
    );
  }

  @Get('articles/trending')
  async getTrending() {
    return await this.appService.getTrendingArticles();
  }

  @Get('articles/:id')
  async getArticle(@Param('id') id: string) {
    return await this.appService.getArticleById(id);
  }
}
