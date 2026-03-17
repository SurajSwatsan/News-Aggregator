import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  ) {}

  async syncRSSNews(sourceId: string) {
    const source = await this.prisma.source.findUnique({ where: { id: sourceId } });
    if (!source || !source.isActive) return;

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
        return;
      }
    }

    this.logger.log(`Syncing RSS news for ${source.name}: ${source.rssUrl}`);

    try {
      const feed = await this.parser.parseURL(source.rssUrl);
      const articles = feed.items.map((item: Parser.Item) => ({
        title: item.title,
        sourceUrl: item.link,
        category: (item as any).categories?.[0] || (item as any).category || null,
        synopsis: item.contentSnippet || item.content,
        imageUrl: this.extractImageFromItem(item),
        postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }));

      let newCount = 0;
      for (const articleData of articles) {
        if (!articleData.sourceUrl) continue;

        const existing = await this.prisma.article.findUnique({ 
          where: { sourceUrl: articleData.sourceUrl } 
        });

        if (!existing) {
          await this.prisma.article.create({
            data: {
              title: articleData.title || 'Untitled',
              sourceUrl: articleData.sourceUrl,
              imageUrl: articleData.imageUrl,
              synopsis: articleData.synopsis,
              category: articleData.category,
              sourceId: source.id,
              postedAt: articleData.postedAt || new Date(),
            }
          });
          newCount++;
        }
      }
      this.logger.log(`Finished ${source.name}. Added ${newCount} new articles.`);
    } catch (error) {
      this.logger.error(`Failed to sync RSS for ${source.name}: ${error.message}`);
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

  async discoverRssUrl(homepageUrl: string): Promise<string | null> {
    try {
      const { data } = await axios.get(homepageUrl);
      const $ = cheerio.load(data);
      
      const rssLink = $('link[type="application/rss+xml"]').attr('href') ||
                      $('link[type="application/atom+xml"]').attr('href') ||
                      $('link[rel="alternate"]').filter((i, el) => {
                        const type = $(el).attr('type') || '';
                        return type.includes('rss') || type.includes('xml');
                      }).attr('href');

      if (rssLink) {
        if (rssLink.startsWith('http')) return rssLink;
        const url = new URL(homepageUrl);
        return `${url.protocol}//${url.host}${rssLink.startsWith('/') ? '' : '/'}${rssLink}`;
      }

      const commonPaths = ['/rss', '/feed', '/rss.xml', '/index.xml'];
      for (const path of commonPaths) {
        const checkUrl = `${homepageUrl.replace(/\/$/, '')}${path}`;
        try {
          await axios.head(checkUrl);
          return checkUrl;
        } catch {}
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
