import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Parser from 'rss-parser';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RSSImporterService {
  private readonly logger = new Logger(RSSImporterService.name);
  private parser = new Parser();

  constructor(private prisma: PrismaService) {}

  async importFromRSSFile(filePath: string) {
    this.logger.log(`Importing publishers from RSS file: ${filePath}`);
    
    try {
      const xml = fs.readFileSync(filePath, 'utf-8');
      const feed = await this.parser.parseString(xml);
      
      this.logger.log(`Found ${feed.items?.length || 0} items in RSS feed`);

      for (const item of feed.items || []) {
        const name = item.title || 'Unknown Publisher';
        const website = item.link || '';
        const rssUrl = item.enclosure?.url || item.link || ''; // Fallback logic

        if (rssUrl) {
          await this.addPublisher(name, website, rssUrl);
        }
      }
      
      // Move processed file to a 'processed' folder or delete it
      const processedDir = path.join(path.dirname(filePath), 'processed');
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }
      const fileName = path.basename(filePath);
      fs.renameSync(filePath, path.join(processedDir, `${Date.now()}-${fileName}`));

    } catch (error) {
      this.logger.error(`Failed to import from RSS file ${filePath}: ${error.message}`);
    }
  }

  private async addPublisher(name: string, website: string, rssUrl: string) {
    const existing = await this.prisma.source.findFirst({
      where: { 
        OR: [
          { name },
          { homepageUrl: website },
          { rssUrl }
        ]
      }
    });

    if (!existing) {
      await this.prisma.source.create({
        data: {
          name,
          homepageUrl: website,
          rssUrl,
          isActive: true,
          scrapingInterval: 60,
        }
      });
      this.logger.log(`✅ Automatically added new publisher: ${name}`);
    } else {
      this.logger.debug(`Publisher ${name} already exists, skipping.`);
    }
  }
}
