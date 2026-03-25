import { Injectable, Logger } from '@nestjs/common';
import { RSSEngineService } from './rss-engine/rss-engine.service';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private rssService: RSSEngineService,
    private prisma: PrismaService,
  ) {}

  getHello(): string {
    return 'Next-Gen News Aggregator API';
  }

  async triggerScrapeAll() {
    this.logger.log('Manually triggering scrape for all active sources');
    const sources = await this.prisma.source.findMany({ where: { isActive: true } });
    
    for (const source of sources) {
      await this.rssService.syncRSSNews(source.id);
    }
    
    return { message: `Scrape triggered for ${sources.length} sources` };
  }

  async getPublicArticles(category?: string, query?: string, skip: number = 0, take: number = 12) {
    const sources = await this.prisma.source.findMany({ where: { isActive: true } });
    const perSourceLimit = skip + take + 10; 
    
    const articlePromises = sources.map(source => {
      const where: any = { sourceId: source.id };
      
      if (category && category !== 'All') {
        where.category = category;
      }

      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { synopsis: { contains: query, mode: 'insensitive' } }
        ];
      }

      return this.prisma.article.findMany({
        where,
        include: {
          source: {
            select: {
              name: true,
              homepageUrl: true,
            }
          }
        },
        orderBy: {
          postedAt: 'desc'
        },
        take: perSourceLimit
      });
    });

    const results = await Promise.all(articlePromises);
    const flattened = results.flat();
    
    const uniqueArticles = this.deDuplicate(flattened);
    
    return uniqueArticles
      .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
      .slice(skip, skip + take);
  }

  private deDuplicate(articles: any[]): any[] {
    const clusterMap = new Map<number, any>();
    const uniqueArticles: any[] = [];

    for (const article of articles) {
      if (article.clusterId === null) {
        // This shouldn't happen with the new ingestion logic, but as a fallback:
        uniqueArticles.push(article);
        continue;
      }

      const existing = clusterMap.get(article.clusterId);
      if (!existing || article.postedAt.getTime() > existing.postedAt.getTime()) {
        clusterMap.set(article.clusterId, article);
      }
    }

    return [...uniqueArticles, ...Array.from(clusterMap.values())];
  }

  private getKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3); // Only consider words longer than 3 chars for better matching
  }

  async getArticleById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        source: {
          select: {
            name: true,
            homepageUrl: true,
          }
        }
      }
    });

    if (!article) return null;

    let relatedArticles: any[] = [];
    if (article.clusterId !== null) {
      relatedArticles = await this.prisma.article.findMany({
        where: {
          clusterId: article.clusterId,
          id: { not: id }, // Exclude current article
        },
        include: {
          source: {
            select: {
              name: true,
            }
          }
        },
        orderBy: {
          postedAt: 'desc'
        },
        take: 5
      });
    }

    return {
      ...article,
      relatedArticles
    };
  }

  async getTrendingArticles() {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    // Fetch articles from last 7 days to keep trending relevant
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const articles = await this.prisma.article.findMany({
      where: {
        postedAt: { gte: sevenDaysAgo }
      },
      include: {
        source: {
          select: { name: true }
        }
      },
      take: 100 // Sample 100 recent articles
    });

    // Since AccessLog is a separate model without a direct relation in prisma schema 
    // (it has articleId as a field but no @relation Article), we'll aggregate manually.
    
    const trendingList = await Promise.all(articles.map(async (article) => {
      const totalViews = await this.prisma.accessLog.count({
        where: { articleId: article.id }
      });

      const recentViews = await this.prisma.accessLog.count({
        where: { 
          articleId: article.id,
          createdAt: { gte: twelveHoursAgo }
        }
      });

      let clusterSize = 0;
      if (article.clusterId !== null) {
        clusterSize = await this.prisma.article.count({
          where: { clusterId: article.clusterId }
        });
      }

      // Calculate Trending Score
      // Weights: Cluster (Multi-source) = 5, Total Views = 1, Recent Pulse = 10
      const score = (totalViews * 1) + (clusterSize * 5) + (recentViews * 10);

      return {
        ...article,
        score,
        totalViews,
        recentViews,
        clusterSize,
        isSpike: recentViews > 5 && (recentViews / Math.max(1, totalViews)) > 0.4,
        isMultiSource: clusterSize > 1,
        isHot: totalViews > 20
      };
    }));

    return trendingList
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
}
