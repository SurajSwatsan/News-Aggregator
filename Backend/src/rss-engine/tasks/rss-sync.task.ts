import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RSSEngineService } from '../rss-engine.service';

@Injectable()
export class RSSSyncTask {
  private readonly logger = new Logger(RSSSyncTask.name);

  constructor(
    private prisma: PrismaService,
    private rssService: RSSEngineService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleDailyRSSSync() {
    this.logger.log('Starting automated RSS news synchronization...');
    
    const activeSources = await this.prisma.source.findMany({
      where: { isActive: true }
    });

    this.logger.log(`Found ${activeSources.length} active publishers for RSS sync.`);

    for (const source of activeSources) {
      try {
        await this.rssService.syncRSSNews(source.id);
      } catch (err) {
        this.logger.error(`Error syncing news for ${source.name}: ${err.message}`);
      }
    }

    this.logger.log('Automated RSS sync cycle complete.');
  }
}
