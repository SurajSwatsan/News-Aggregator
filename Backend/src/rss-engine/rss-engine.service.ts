import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

@Injectable()
export class RSSEngineService {
  private readonly logger = new Logger(RSSEngineService.name);
  private parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent', { keepArray: true }],
        ['media:thumbnail', 'mediaThumbnail'],
        ['content:encoded', 'contentEncoded'],
      ],
    },
  });

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  private async retry<T>(
    operation: () => Promise<T>,
    label: string,
    retries = 3,
    delay = 2000,
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        const backoff = delay * Math.pow(2, i);
        this.logger.warn(
          `Retrying ${label} in ${backoff}ms... (Attempt ${i + 1}/${retries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    throw new Error(`Failed ${label} after ${retries} attempts`);
  }

  async syncRSSNews(sourceId: string): Promise<number> {
    let aiConsecutiveFailures = 0;
    try {
<<<<<<< HEAD
      const source = await this.prisma.source.findUnique({
        where: { id: sourceId },
=======
      const source = await this.prisma.source.findUnique({ 
        where: { id: sourceId },
        include: { owner: true }
>>>>>>> 71079a29c9e6895199c0572cf8ea02c4170efe7c
      });
      if (!source || !source.isActive) return 0;

      // Strict RSS Check
      if (!source.rssUrl) {
        this.logger.warn(
          `Source ${source.name} has no RSS URL. Attempting discovery...`,
        );
        const discovered = await this.discoverRssUrl(source.homepageUrl);
        if (discovered) {
          await this.prisma.source.update({
            where: { id: source.id },
            data: { rssUrl: discovered },
          });
          source.rssUrl = discovered;
        } else {
          this.logger.error(
            `No RSS feed found for ${source.name}. Skipping sync.`,
          );
          return 0;
        }
      }

      this.logger.log(`Syncing RSS news for ${source.name}: ${source.rssUrl}`);

      let feed: Parser.Output<any>;
      try {
        feed = await this.retry(
          () => this.parser.parseURL(source.rssUrl!),
          `RSS parse for ${source.name}`,
        );
      } catch (parseError) {
        this.logger.warn(
          `Failed to parse stored RSS URL ${source.rssUrl}: ${parseError.message}. Attempting re-discovery...`,
        );
        const discovered = await this.discoverRssUrl(source.homepageUrl);
        if (discovered && discovered !== source.rssUrl) {
          this.logger.log(
            `Found new RSS URL for ${source.name}: ${discovered}`,
          );
          await this.prisma.source.update({
            where: { id: source.id },
            data: { rssUrl: discovered },
          });
          feed = await this.retry(
            () => this.parser.parseURL(discovered),
            `RSS parse (discovered) for ${source.name}`,
          );
        } else {
          this.logger.error(
            `No working RSS feed found for ${source.name}. ${parseError.message}`,
          );
          return 0;
        }
      }

      if (!feed || !feed.items) {
        this.logger.error(
          `Parsed feed for ${source.name} is empty or invalid.`,
        );
        return 0;
      }

      this.logger.log(
        `Parsed feed for ${source.name}: ${feed.items?.length || 0} items found.`,
      );

      const articleDataList = feed.items.map((item: Parser.Item) => {
        const rawCategory = this.safeString(
          (item as any).categories?.[0] || (item as any).category,
        );
        const guid = this.safeString(item.guid);

        return {
          title: this.safeString(item.title),
          sourceUrl: this.safeString(item.link || guid || (item as any).id),
          rawCategory,
          content: this.safeString(item.contentSnippet || item.content),
          imageUrl: this.extractImageFromItem(item),
          postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        };
      });

      let newCount = 0;

      // Use Promise.all with a simple concurrency limit approach if needed,
      // but here we just process them to avoid blocking the whole loop.
      await Promise.all(
        articleDataList.map(async (data) => {
          try {
            if (!data.sourceUrl) return;

            const existing = await this.prisma.article.findUnique({
              where: { sourceUrl: data.sourceUrl },
            });

            if (existing) {
              if (existing.sourceId !== source.id && source.ownerId) {
                // The publisher is claiming their articles that were globally seeded
                await this.prisma.article.update({
                  where: { id: existing.id },
                  data: { sourceId: source.id },
                });
                newCount++;
              }
              return;
            }

            // Language Detection: Skip AI for non-English content to prevent timeouts
            const isEnglish = /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(
              data.title || '',
            );

            let summary = data.content
              ? this.stripHtml(data.content)
              : data.title || '';
            let category = 'General';

            if (isEnglish && aiConsecutiveFailures < 3) {
              try {
                // Categorization (Fast fallback)
                const mappedCategory = await this.mapCategory(
                  data.rawCategory,
                  data.title || '',
                  data.content,
                  false,
                );
                category = mappedCategory;

                // Summarization
                const startAi = Date.now();
                const aiSummary = await this.aiService.summarize(summary);
                if (
                  Date.now() - startAi > 15000 ||
                  aiSummary.toLowerCase().includes('failed')
                ) {
                  aiConsecutiveFailures++;
                } else {
                  aiConsecutiveFailures = 0;
                  summary = aiSummary;
                }
              } catch (aiErr) {
                this.logger.warn(
                  `AI processing intermittent failure: ${aiErr.message}`,
                );
                aiConsecutiveFailures++;
              }
            } else {
              // Non-English or AI failing: Fallback to keyword matching only
              category = await this.mapCategory(
                data.rawCategory,
                data.title || '',
                data.content,
                true,
              );
              summary =
                summary.length > 250
                  ? summary.substring(0, 250) + '...'
                  : summary;
            }

            const clusterId = await this.findClusterId(
              data.title || '',
              summary || '',
            );

            await this.prisma.article.create({
              data: {
                title: data.title || 'Untitled',
                sourceUrl: data.sourceUrl,
                imageUrl: data.imageUrl,
                synopsis: summary,
                category: category,
                sourceId: source.id,
                postedAt: data.postedAt || new Date(),
                clusterId: clusterId,
              },
            });
            newCount++;
          } catch (articleError) {
            this.logger.error(
              `Error processing article ${data?.sourceUrl}: ${articleError.message}`,
            );
          }
        }),
      );

<<<<<<< HEAD
      this.logger.log(
        `Finished ${source.name}. Added ${newCount} new articles.`,
      );
=======
          await this.prisma.article.create({
            data: {
              title: data.title || 'Untitled',
              sourceUrl: data.sourceUrl,
              imageUrl: data.imageUrl,
              synopsis: summary,
              category: category,
              sourceId: source.id,
              postedAt: data.postedAt || new Date(),
              clusterId: clusterId,
              city: source.owner?.city,
              state: source.owner?.state,
              country: source.owner?.country,
            }
          });
          newCount++;
        } catch (articleError) {
          this.logger.error(`Error processing article ${data?.sourceUrl}: ${articleError.message}`);
        }
      }));

      this.logger.log(`Finished ${source.name}. Added ${newCount} new articles.`);
>>>>>>> 71079a29c9e6895199c0572cf8ea02c4170efe7c
      return newCount;
    } catch (error) {
      this.logger.error(`Failed to sync RSS for ${sourceId}: ${error.message}`);
      return 0;
    }
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    try {
      const $ = cheerio.load(html);
      return $.text().trim().replace(/\s\s+/g, ' ');
    } catch (e) {
      return String(html).replace(/<[^>]*>?/gm, '');
    }
  }

  private safeString(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      const inner =
        val._ ||
        val.text ||
        val.name ||
        val.title ||
        val.content ||
        val.$?.domain ||
        val.$?.url ||
        '';
      return String(inner);
    }
    return String(val);
  }

  async findClusterId(
    title: string,
    synopsis: string,
  ): Promise<number> {
    const recentTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    // 1. Get recent articles that have a clusterId
    const recentArticles = await this.prisma.article.findMany({
      where: {
        postedAt: { gte: recentTime },
        clusterId: { not: null },
      },
      select: {
        id: true,
        title: true,
        synopsis: true,
        clusterId: true,
      },
    });

    const words = this.getKeywords(title);
    this.logger.debug(`Keywords for "${title}": [${words.join(', ')}]`);

    for (const recent of recentArticles) {
      const recentWords = this.getKeywords(recent.title);
      const overlap = words.filter((w) => recentWords.includes(w)).length;
      const ratio = overlap / Math.max(words.length, recentWords.length);

      // Fast check: 50% keyword overlap (increased from 0.4) triggers AI comparison
      if (ratio >= 0.5) {
        this.logger.log(
          `High keyword overlap (${(ratio * 100).toFixed(1)}%) between "${title}" and "${recent.title}". Triggering AI check...`,
        );
        const isSimilar = await this.aiService.areArticlesSimilar(
          title,
          synopsis,
          recent.title,
          recent.synopsis || '',
        );

        if (isSimilar) {
          this.logger.log(
            `✅ Similarity CONFIRMED by AI. Article matches cluster ${recent.clusterId}`,
          );
          return recent.clusterId!;
        } else {
          this.logger.log(
            `❌ Similarity REJECTED by AI for overlapping titles: "${title}" vs "${recent.title}"`,
          );
        }
      } else if (ratio > 0.1) {
        this.logger.debug(
          `Low overlap (${(ratio * 100).toFixed(1)}%) with "${recent.title}". Skipping AI check.`,
        );
      }
    }

    // 2. If no match found, generate new clusterId
    this.logger.log(
      `No matching clusters found for "${title}". Generating new ID.`,
    );
    const maxCluster = await this.prisma.article.aggregate({
      _max: { clusterId: true },
    });

    return (maxCluster._max.clusterId || 0) + 1;
  }

  private getKeywords(text: string): string[] {
    const stopWords = new Set([
      'the',
      'this',
      'that',
      'with',
      'from',
      'brought',
      'shares',
      'warns',
      'shows',
      'tells',
      'will',
      'your',
      'says',
      'about',
      'amid',
      'could',
      'would',
      'after',
      'before',
      'while',
      'during',
      'must',
      'they',
      'them',
      'their',
      'when',
      'where',
      'been',
      'were',
      'have',
      'than',
      'into',
      'action',
      'says',
      'calls',
      'seeks',
      'claims',
      'reports',
      'take',
      'make',
      'just',
      'more',
      'some',
      'over',
      'back',
      'last',
      'next',
      'been',
      'being',
      'been',
      'also',
      'only',
      'very',
      'been',
      'horoscope',
      'zodiac',
      'daily',
      'tomorrow',
      'yesterday',
    ]);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
  }

  private extractImageFromItem(item: any): string | null {
    // 1. Check Media tags (using customFields results) - High Priority
    const mediaContent = item.mediaContent;
    const mediaThumbnail = item.mediaThumbnail;

    // Handle array case for mediaContent (from keepArray: true)
    if (Array.isArray(mediaContent) && mediaContent.length > 0) {
      // Find the one with largest width or just the first non-thumbnail one
      const best =
        mediaContent.find((m: any) => {
          const url = m.$?.url || '';
          return url && !url.match(/thumb|small|100x100|80x80/i);
        }) || mediaContent[0];

      if (best?.$?.url) return best.$.url;
    }

    // Handle single object/string case
    if (
      mediaContent?.$?.url &&
      !mediaContent.$.url.match(/thumb|small|100x100/i)
    )
      return mediaContent.$.url;

    // 2. Check Enclosure (Standard)
    if (item.enclosure?.url) return item.enclosure.url;

    // 3. Last resort: Thumbnail but check it's not tiny
    if (mediaThumbnail?.$?.url) return mediaThumbnail.$.url;

    // 3. Fallback to extracting from HTML content (Cheerio)
    const contentToScan =
      item.contentEncoded || item.content || item.contentSnippet || '';
    return this.extractImageFromContent(contentToScan);
  }

  private extractImageFromContent(content: string): string | null {
    if (!content) return null;
    const $ = cheerio.load(content);
    // Find the largest image or any primary-looking image
    const imgs = $('img').toArray();
    if (imgs.length === 0) return null;

    // Attempt logic to find the 'hero' image
    const bestImg =
      imgs.find((img) => {
        const src = $(img).attr('src') || '';
        return src && !src.match(/icon|logo|avatar|ads|banner/i);
      }) || imgs[0];

    return $(bestImg).attr('src') || null;
  }

  async mapCategory(
    raw: string,
    title: string,
    content: string,
    skipAi = false,
  ): Promise<string> {
    const text = `${raw} ${title} ${content}`.toLowerCase();

    // 1. Try AI Categorization (Most Accurate)
    if (!skipAi) {
      try {
        const categoriesList = [
          'Technology',
          'Business',
          'Politics',
          'Sports',
          'Entertainment',
          'Science',
          'Health',
          'Sports',
          'Lifestyle',
          'Environment',
          'World',
          'Media',
          'Agriculture',
          'Crime',
          'General',
        ];

        const aiCategory = await this.aiService.categorize(
          title,
          content,
          categoriesList,
        );
        if (aiCategory && categoriesList.includes(aiCategory)) {
          return aiCategory;
        }
      } catch (e) {
        this.logger.warn(
          `AI Categorization failed: ${e.message}. Falling back to keyword matching.`,
        );
      }
    }

    // 2. Fallback to Keyword Matching (Faster)
    if (
      text.match(
        /\b(tech|gadget|software|ai|internet|silicon|computing|mobile|device)\b/,
      )
    )
      return 'Technology';
    if (
      text.match(
        /\b(stock|market|finance|economy|business|corporate|startup|money|bank)\b/,
      )
    )
      return 'Business';
    if (
      text.match(
        /\b(politic|election|government|parliament|senate|white house|minister|diplomacy)\b/,
      )
    )
      return 'Politics';
    if (
      text.match(
        /\b(sport|cricket|football|olympic|tennis|stadium|match|tournament|fifa|ipl)\b/,
      )
    )
      return 'Sports';
    if (
      text.match(
        /\b(entertainment|movie|film|actor|music|hollywood|bollywood|celebrity|oscar)\b/,
      )
    )
      return 'Entertainment';
    if (
      text.match(
        /\b(health|medical|doctor|virus|vaccine|disease|hospital|patient|surgery|remedy)\b/,
      )
    )
      return 'Health';
    if (
      text.match(
        /\b(science|research|study|space|nasa|astronomy|physics|biology|chemistry)\b/,
      )
    )
      return 'Science';
    if (
      text.match(
        /\b(crime|arrest|police|murder|theft|robbery|scam|fraud|jail|prison|scandal|investigation|kidnap)\b/,
      )
    )
      return 'Crime';
    if (
      text.match(
        /\b(environment|climate|nature|forest|pollution|recycle|green energy|ocean)\b/,
      )
    )
      return 'Environment';
    if (
      text.match(
        /\b(farmer|farming|agriculture|crop|harvest|basmati|wheat|rice|irrigation|soil|livestock|dairy)\b/,
      )
    )
      return 'Agriculture';
    if (text.match(/\b(world|international|global|nation|country)\b/))
      return 'World';
    if (text.match(/\b(lifestyle|travel|food|cooking|fashion|luxury|style)\b/))
      return 'Lifestyle';
    if (
      text.match(
        /\b(media|journalism|press|newspaper|broadcast|television|radio)\b/,
      )
    )
      return 'Media';

    return 'General';
  }

  async discoverRssUrl(homepageUrl: string): Promise<string | null> {
    try {
      const { data } = await this.retry(
        () => axios.get(homepageUrl, { timeout: 15000 }),
        `RSS discovery for ${homepageUrl}`,
      );
      const $ = cheerio.load(data);

      const rssLink =
        $('link[type="application/rss+xml"]').attr('href') ||
        $('link[type="application/atom+xml"]').attr('href') ||
        $('link[rel="alternate"]')
          .filter((i, el) => {
            const type = $(el).attr('type') || '';
            return type.includes('rss') || type.includes('xml');
          })
          .attr('href');

      if (rssLink) {
        let finalUrl = rssLink;
        if (!rssLink.startsWith('http')) {
          const url = new URL(homepageUrl);
          finalUrl = `${url.protocol}//${url.host}${rssLink.startsWith('/') ? '' : '/'}${rssLink}`;
        }
        return finalUrl;
      }

      // Try common paths
      const commonPaths = [
        '/rss',
        '/feed',
        '/rss.xml',
        '/index.xml',
        '/rss-feed',
      ];
      for (const pathStr of commonPaths) {
        const checkUrl = `${homepageUrl.replace(/\/$/, '')}${pathStr}`;
        try {
          const res = await axios.head(checkUrl, { timeout: 5000 });
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('xml') || contentType.includes('rss')) {
            return checkUrl;
          }
        } catch {}
      }
    } catch (error) {
      this.logger.error(
        `Error discovering RSS URL for ${homepageUrl}: ${error.message}`,
      );
    }
    return null;
  }
}
