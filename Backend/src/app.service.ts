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
    const where: any = {};
    
    if (category && category !== 'All') {
      where.category = category;
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { synopsis: { contains: query, mode: 'insensitive' } },
        { source: { name: { contains: query, mode: 'insensitive' } } }
      ];
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: {
        source: {
          select: {
            name: true,
            homepageUrl: true
          }
        }
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: skip + take + 100 // Get enough for de-duplication
    });

    // Calculate cluster sizes for the batch
    const clusterIds = articles.map(a => a.clusterId).filter(id => id !== null) as number[];
    const clusterCounts = await this.prisma.article.groupBy({
      by: ['clusterId'],
      where: { clusterId: { in: clusterIds } },
      _count: { _all: true }
    });
    const clusterSizeMap = new Map(clusterCounts.map(c => [c.clusterId, c._count._all]));

    // Calculate Importance Score for each article
    const scoredArticles = articles.map(article => {
      const clusterSize = article.clusterId ? (clusterSizeMap.get(article.clusterId) || 1) : 1;
      const sourcePriority = (article.source as any)?.priority || 0;
      
      // Recency Score: Linear decay over 48 hours (max 100 points)
      const hoursOld = (Date.now() - article.postedAt.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 100 - (hoursOld * 2)); 
      
      // Quality Score: Based on manually set source priority (max ~200 points)
      const qualityScore = sourcePriority * 50;
      
      // Impact Score: Based on how many sources covered the story (max ~150 points)
      const impactScore = Math.min(6, clusterSize) * 25;

      const importanceScore = recencyScore + qualityScore + impactScore;
      
      return { ...article, importanceScore, clusterSize };
    });

    const uniqueArticles = this.deDuplicate(scoredArticles, 'score');
    
    return uniqueArticles
      .sort((a, b) => b.importanceScore - a.importanceScore)
      .slice(skip, skip + take);
  }

  async getArticleById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            homepageUrl: true,
          }
        }
      }
    });

    if (!article) return null;

    let relatedArticles: any[] = [];
    
    // 1. Cluster-based related (priority: other publishers)
    if (article.clusterId !== null) {
      const clusterArticles = await this.prisma.article.findMany({
        where: {
          clusterId: article.clusterId,
          id: { not: id },
        },
        include: { source: { select: { id: true, name: true } } },
        orderBy: { postedAt: 'desc' },
        take: 10 // Get more to allow diversity filtering
      });

      // Prioritize "Other Publishers"
      const otherPublishers = clusterArticles.filter(a => a.sourceId !== article.sourceId);
      const samePublisher = clusterArticles.filter(a => a.sourceId === article.sourceId);
      
      relatedArticles = [...otherPublishers, ...samePublisher].slice(0, 6);
    }

    // 2. Keyword-based fallback (if cluster is thin)
    if (relatedArticles.length < 6) {
      const keywords = this.getKeywords(article.title);
      const filteredKeywords = keywords.filter(w => !['breaking', 'update', 'latest', 'live', 'amid', 'reports', 'claims', 'arrests', 'action'].includes(w));
      const searchTerms = filteredKeywords.length > 0 ? filteredKeywords : keywords.slice(0, 2);

      if (searchTerms.length > 0) {
        let additional = await this.prisma.article.findMany({
          where: {
            id: { notIn: [id, ...relatedArticles.map(a => a.id)] },
            OR: searchTerms.map(term => ({ title: { contains: term, mode: 'insensitive' } }))
          },
          include: { source: { select: { id: true, name: true } } },
          orderBy: { postedAt: 'desc' },
          take: 20 // Get more for ranking
        });

        // Rank by mutual keyword count
        const rankedResults = additional.map(item => {
          const itemKeywords = this.getKeywords(item.title);
          const commonCount = itemKeywords.filter(w => keywords.includes(w)).length;
          
          // Boost items from other publishers
          const diversityBoost = item.sourceId !== article.sourceId ? 1.5 : 1.0;
          const score = commonCount * diversityBoost;
          
          return { ...item, score };
        })
        .filter(item => item.score > 0.5) // Remove very weak matches
        .sort((a, b) => b.score - a.score);
        
        relatedArticles = [...relatedArticles, ...rankedResults].slice(0, 8);
      }
    }

    return {
      ...article,
      relatedArticles: relatedArticles.slice(0, 8)
    };
  }

  private getKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'this', 'that', 'with', 'from', 'brought', 'shares', 'warns', 'shows', 
      'tells', 'will', 'your', 'says', 'about', 'amid', 'could', 'would', 'after', 
      'before', 'while', 'during', 'must', 'they', 'them', 'their', 'when', 'where', 
      'been', 'were', 'have', 'than', 'into', 'action', 'says', 'calls', 'seeks', 
      'claims', 'reports', 'take', 'make', 'just', 'more', 'some', 'over', 'back',
      'last', 'next', 'been', 'being', 'been', 'also', 'only', 'very', 'been',
      'horoscope', 'zodiac', 'daily', 'tomorrow', 'yesterday'
    ]);
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
  }

  async getTrendingArticles() {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

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
      take: 100 
    });

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

    const uniqueTrending = this.deDuplicate(trendingList, 'score');

    return uniqueTrending
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private deDuplicate(articles: any[], sortBy: 'postedAt' | 'score' = 'postedAt'): any[] {
    const clusterMap = new Map<number, any[]>();
    const uniqueArticles: any[] = [];

    for (const article of articles) {
      if (article.clusterId === null) {
        uniqueArticles.push(article);
        continue;
      }

      if (!clusterMap.has(article.clusterId)) {
        clusterMap.set(article.clusterId, []);
      }
      clusterMap.get(article.clusterId)!.push(article);
    }

    // For each cluster, decide how many and which ones to show
    const deduplicatedClusters = Array.from(clusterMap.values()).map(clusterGroup => {
      // Sort by score or date
      clusterGroup.sort((a, b) => {
        if (sortBy === 'postedAt') return b.postedAt.getTime() - a.postedAt.getTime();
        return (b.importanceScore || b.score) - (a.importanceScore || a.score);
      });

      const best = clusterGroup[0];
      const clusterSize = best.clusterSize || clusterGroup.length;
      
      // Logic for "Multiple Times": 
      // If a story is huge (impact > 125pts or 4+ sources) and there is another high-priority source available
      if (clusterSize >= 4 && clusterGroup.length > 1) {
        const secondBest = clusterGroup[1];
        // Only show second if it's from a different source and has decent quality
        if (secondBest.sourceId !== best.sourceId && (secondBest.importanceScore || 0) > 150) {
          return [best, secondBest];
        }
      }

      return [best];
    }).flat();

    return [...uniqueArticles, ...deduplicatedClusters];
  }
}
