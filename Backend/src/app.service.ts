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

  async getPublicArticles(category?: string, query?: string) {
    const sources = await this.prisma.source.findMany({ where: { isActive: true } });
    const perSourceLimit = 15; // Pull enough from each to ensure variety
    
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
    
    // De-duplicate stories that are very similar
    const uniqueArticles = this.deDuplicate(flattened);
    
    // Sort by postedAt desc and return top 100
    return uniqueArticles
      .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
      .slice(0, 100);
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
    return await this.prisma.article.findUnique({
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
  }
}
