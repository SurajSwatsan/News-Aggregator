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

  async syncRSSNews(sourceId: string): Promise<number> {
    let newCount = 0;
    let aiConsecutiveFailures = 0;
    try {
      const source = await this.prisma.source.findUnique({ where: { id: sourceId } });
      if (!source || !source.isActive) return 0;

      // Strict RSS Check
      if (!source.rssUrl) {
        this.logger.warn(`Source ${source.name} has no RSS URL. Attempting discovery...`);
        const discovered = await this.discoverRssUrl(source.homepageUrl);
        if (discovered) {
          await this.prisma.source.update({
            where: { id: source.id },
            data: { rssUrl: discovered }
          });
          source.rssUrl = discovered;
        } else {
          this.logger.error(`No RSS feed found for ${source.name}. Skipping sync.`);
          return 0;
        }
      }

      this.logger.log(`Syncing RSS news for ${source.name}: ${source.rssUrl}`);
      
      let feed;
      try {
        feed = await this.parser.parseURL(source.rssUrl);
      } catch (parseError) {
        this.logger.warn(`Failed to parse stored RSS URL ${source.rssUrl}: ${parseError.message}. Attempting re-discovery...`);
        const discovered = await this.discoverRssUrl(source.homepageUrl);
        if (discovered && discovered !== source.rssUrl) {
          this.logger.log(`Found new RSS URL for ${source.name}: ${discovered}`);
          await this.prisma.source.update({
            where: { id: source.id },
            data: { rssUrl: discovered }
          });
          feed = await this.parser.parseURL(discovered);
        } else {
          this.logger.error(`No working RSS feed found for ${source.name}. ${parseError.message}`);
          return 0;
        }
      }

      if (!feed || !feed.items) {
        this.logger.error(`Parsed feed for ${source.name} is empty or invalid.`);
        return 0;
      }

      this.logger.log(`Parsed feed for ${source.name}: ${feed.items?.length || 0} items found.`);
      
      const articles = feed.items.map((item: Parser.Item) => {
        const rawCategory = (item as any).categories?.[0] || (item as any).category || '';
        const mappedCategory = this.mapCategory(rawCategory, item.title || '', item.contentSnippet || item.content || '');
        
        let guid = item.guid;
        if (guid && typeof guid === 'object') {
          guid = (guid as any)._ || (guid as any).text;
        }

        return {
          title: item.title,
          sourceUrl: item.link || (guid as string) || (item as any).id,
          category: mappedCategory,
          synopsis: item.contentSnippet || item.content,
          imageUrl: this.extractImageFromItem(item),
          postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        };
      });

      let newCount = 0;
      for (const articleData of articles) {
        try {
          if (!articleData.sourceUrl) continue;

          const existing = await this.prisma.article.findUnique({ 
            where: { sourceUrl: articleData.sourceUrl } 
          });

          if (!existing) {
            let summary = articleData.synopsis || articleData.title || '';
            
            // Generate Summary using Llama 3 (if not failing consistently)
            if (aiConsecutiveFailures < 3) {
              const startAi = Date.now();
              const aiSummary = await this.aiService.summarize(summary);
              if (Date.now() - startAi > 9500 || aiSummary.includes('failed')) {
                aiConsecutiveFailures++;
              } else {
                aiConsecutiveFailures = 0; // Reset on success
                summary = aiSummary;
              }
            } else {
               // Too many failures, skip AI to save time
               summary = summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
            }
            
            await this.prisma.article.create({
              data: {
                title: articleData.title || 'Untitled',
                sourceUrl: articleData.sourceUrl,
                imageUrl: articleData.imageUrl,
                synopsis: summary,
                category: articleData.category,
                sourceId: source.id,
                postedAt: articleData.postedAt || new Date(),
              }
            });
            newCount++;
          }
        } catch (articleError) {
          this.logger.error(`Error processing article ${articleData?.sourceUrl}: ${articleError.message}`);
          continue;
        }
      }
      this.logger.log(`Finished ${source.name}. Added ${newCount} new articles.`);
      return newCount;
    } catch (error) {
      this.logger.error(`Failed to sync RSS for ${sourceId}: ${error.message}`);
      return 0;
    }
  }

  private extractImageFromItem(item: any): string | null {
    // 1. Check Enclosure (Standard)
    if (item.enclosure?.url) return item.enclosure.url;

    // 2. Check Media tags (using customFields results)
    const mediaContent = item.mediaContent;
    const mediaThumbnail = item.mediaThumbnail;

    // Handle array case for mediaContent (from keepArray: true)
    if (Array.isArray(mediaContent) && mediaContent.length > 0) {
      const best = mediaContent.find(m => m.$?.url) || mediaContent[0];
      if (best?.$?.url) return best.$.url;
    }

    // Handle single object/string case
    if (mediaContent?.$?.url) return mediaContent.$.url;
    if (mediaThumbnail?.$?.url) return mediaThumbnail.$.url;

    // 3. Fallback to extracting from HTML content (Cheerio)
    const contentToScan = item.contentEncoded || item.content || item.contentSnippet || '';
    return this.extractImageFromContent(contentToScan);
  }

  private extractImageFromContent(content: string): string | null {
    if (!content) return null;
    const $ = cheerio.load(content);
    return $('img').attr('src') || null;
  }

  private mapCategory(raw: string, title: string, content: string): string {
    const text = `${raw} ${title} ${content}`.toLowerCase();
    
    if (text.match(/tech|gadget|software|ai|internet|silicon|computing|mobile|device/)) return 'Technology';
    if (text.match(/stock|market|finance|economy|business|corporate|startup|money|bank/)) return 'Business';
    if (text.match(/politic|election|government|parliament|senate|white house|minister|diplomacy/)) return 'Politics';
    if (text.match(/sport|cricket|football|olympic|tennis|stadium|match|tournament|fifa/)) return 'Sports';
    if (text.match(/entertainment|movie|film|actor|music|hollywood|bollywood|celebrity|oscar/)) return 'Entertainment';
    if (text.match(/health|medical|doctor|virus|vaccine|disease|science|research|study|space|nasa/)) return 'Science';
    if (text.match(/environment|climate|nature|forest|pollution|recycle|green energy|ocean/)) return 'Environment';
    if (text.match(/world|international|global|nation|country/)) return 'World';
    if (text.match(/lifestyle|travel|food|cooking|fashion|luxury|style/)) return 'Lifestyle';
    
    return 'General';
  }

  async discoverRssUrl(homepageUrl: string): Promise<string | null> {
    try {
      const { data } = await axios.get(homepageUrl, { timeout: 10000 });
      const $ = cheerio.load(data);
      
      const rssLink = $('link[type="application/rss+xml"]').attr('href') ||
                      $('link[type="application/atom+xml"]').attr('href') ||
                      $('link[rel="alternate"]').filter((i, el) => {
                        const type = $(el).attr('type') || '';
                        return type.includes('rss') || type.includes('xml');
                      }).attr('href');

      if (rssLink) {
        let finalUrl = rssLink;
        if (!rssLink.startsWith('http')) {
          const url = new URL(homepageUrl);
          finalUrl = `${url.protocol}//${url.host}${rssLink.startsWith('/') ? '' : '/'}${rssLink}`;
        }
        
        // Verify Content-Type
        try {
          const head = await axios.head(finalUrl, { timeout: 5000 });
          const contentType = head.headers['content-type'] || '';
          if (contentType.includes('xml') || contentType.includes('rss')) return finalUrl;
        } catch {
          return finalUrl; // Fallback to just returning it
        }
      }

      const commonPaths = ['/rss', '/feed', '/rss.xml', '/index.xml', '/rss-feed'];
      for (const pathStr of commonPaths) {
        const checkUrl = `${homepageUrl.replace(/\/$/, '')}${pathStr}`;
        try {
          const res = await axios.head(checkUrl, { timeout: 5000 });
          const contentType = res.headers['content-type'] || '';
          // Avoid HTML landing pages (common for /rss)
          if (contentType.includes('xml') || contentType.includes('rss')) {
            return checkUrl;
          }
        } catch {}
      }

      return null;
    } catch (error) {
      this.logger.error(`Discovery failed for ${homepageUrl}: ${error.message}`);
      return null;
    }
  }
}
