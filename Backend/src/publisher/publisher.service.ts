import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RSSEngineService } from '../rss-engine/rss-engine.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PublisherService {
  constructor(
    private prisma: PrismaService,
    private rssEngine: RSSEngineService,
    @InjectQueue('sync-articles') private syncQueue: Queue,
  ) {}

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

  async getArticles(userId: string, search?: string) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');

    return this.prisma.article.findMany({
      where: { 
        sourceId: source.id,
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {})
      },
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

  async getSourceDetails(userId: string) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');
    return {
      name: source.name,
      url: source.homepageUrl,
      description: source.description || '',
    };
  }

  async updateSourceDetails(userId: string, data: any) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Source details
      const updatedSource = await tx.source.update({
        where: { id: source.id },
        data: {
          name: data.name,
          homepageUrl: data.url,
          description: data.description,
        }
      });

      // 2. Sync to User for Profile consistency
      await tx.user.update({
        where: { id: userId },
        data: {
          orgName: data.name,
          orgWebsite: data.url,
          orgDescription: data.description
        }
      });

      return updatedSource;
    });
  }

  async getFeeds(userId: string) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');

    return source.rssUrl ? [{ url: source.rssUrl, status: 'Active', lastSync: source.updatedAt }] : [];
  }

  async addFeed(userId: string, url: string) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Source RSS URL
      const updatedSource = await tx.source.update({
        where: { id: source.id },
        data: { rssUrl: url }
      });

      // 2. Sync to User for Profile consistency
      await tx.user.update({
        where: { id: userId },
        data: { rssUrl: url }
      });

      return updatedSource;
    });
  }

  async createArticle(userId: string, data: any) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');

    return this.prisma.article.create({
      data: {
        sourceId: source.id,
        title: data.title,
        synopsis: data.synopsis,
        category: data.category,
        sourceUrl: data.sourceUrl,
        imageUrl: data.imageUrl,
        isManual: true,
        postedAt: new Date(),
      }
    });
  }

  async triggerSync(userId: string) {
    const source = await this.prisma.source.findFirst({ where: { ownerId: userId } });
    if (!source) throw new NotFoundException('No news source found for this publisher');

    if (!source.rssUrl) return { message: 'No RSS URL configured.' };

    // Offload to background queue
    await this.syncQueue.add('sync', { sourceId: source.id });

    return { 
      message: 'Background synchronization started. The list will update automatically.' 
    };
  }
}
