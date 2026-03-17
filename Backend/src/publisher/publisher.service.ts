import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublisherService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');

    const totalArticles = await this.prisma.article.count({ where: { sourceId: source.id } });
    
    return {
      sourceName: source.name,
      stats: {
        articles: totalArticles,
        totalViews: totalArticles * 124, // Mock multiplier
        revenue: (totalArticles * 124 * 0.1).toFixed(2), // Mock revenue calculation
        activeReaders: Math.floor(totalArticles / 2),
      },
    };
  }

  async getArticles(userId: string) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');

    return this.prisma.article.findMany({
      where: { sourceId: source.id },
      orderBy: { postedAt: 'desc' },
      take: 50,
    });
  }

  async getTrafficAnalytics(userId: string) {
    // Mock time-series data
    return [
      { date: '2026-03-10', views: 450 },
      { date: '2026-03-11', views: 520 },
      { date: '2026-03-12', views: 480 },
      { date: '2026-03-13', views: 610 },
      { date: '2026-03-14', views: 590 },
      { date: '2026-03-15', views: 720 },
      { date: '2026-03-16', views: 124 },
    ];
  }

  async getRevenueStats(userId: string) {
    return {
      currentBalance: '1,240.50',
      pendingPayout: '450.00',
      totalEarned: '12,500.00',
    };
  }
}
