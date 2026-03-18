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

  async getPublicArticles(category?: string) {
    const sources = await this.prisma.source.findMany({ where: { isActive: true } });
    const perSourceLimit = 15; // Pull enough from each to ensure variety
    
    const articlePromises = sources.map(source => {
      const where: any = { sourceId: source.id };
      if (category && category !== 'All') {
        where.category = category;
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
    
    // Sort by postedAt desc and return top 100
    return flattened
      .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
      .slice(0, 100);
  }
}
