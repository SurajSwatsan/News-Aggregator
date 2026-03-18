import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PublisherGuard } from '../auth/publisher.guard';

@Controller('publisher')
@UseGuards(JwtAuthGuard, PublisherGuard)
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    const userId = req.user.id; 
    return this.publisherService.getDashboardStats(userId);
  }

  @Get('articles')
  async getArticles(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getArticles(userId);
  }

  @Get('analytics')
  async getAnalytics(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getTrafficAnalytics(userId);
  }

  @Get('revenue')
  async getRevenue(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getRevenueStats(userId);
  }

  @Get('source')
  async getSource(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getSourceDetails(userId);
  }

  @Put('source')
  async updateSource(@Request() req: any, @Body() data: any) {
    const userId = req.user.id;
    return this.publisherService.updateSourceDetails(userId, data);
  }

  @Get('feeds')
  async getFeeds(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getFeeds(userId);
  }

  @Post('feeds')
  async addFeed(@Request() req: any, @Body('url') url: string) {
    const userId = req.user.id;
    return this.publisherService.addFeed(userId, url);
  }

  @Post('articles')
  async createArticle(@Request() req: any, @Body() data: any) {
    const userId = req.user.id;
    return this.publisherService.createArticle(userId, data);
  }

  @Post('sync')
  async sync(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.triggerSync(userId);
  }
}
