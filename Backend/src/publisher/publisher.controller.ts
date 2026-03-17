import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PublisherService } from './publisher.service';

@Controller('publisher')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    // Assuming req.user.id comes from JWT auth (currently hardcoded to 1 for dev)
    const userId = req.user?.id || '2f8d0ce5-2989-4131-84e0-a55b43891d5a'; 
    return this.publisherService.getDashboardStats(userId);
  }

  @Get('articles')
  async getArticles(@Request() req: any) {
    const userId = req.user?.id || '2f8d0ce5-2989-4131-84e0-a55b43891d5a';
    return this.publisherService.getArticles(userId);
  }

  @Get('analytics')
  async getAnalytics(@Request() req: any) {
    const userId = req.user?.id || '2f8d0ce5-2989-4131-84e0-a55b43891d5a';
    return this.publisherService.getTrafficAnalytics(userId);
  }

  @Get('revenue')
  async getRevenue(@Request() req: any) {
    const userId = req.user?.id || '2f8d0ce5-2989-4131-84e0-a55b43891d5a';
    return this.publisherService.getRevenueStats(userId);
  }
}
