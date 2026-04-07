import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RSSImporterService } from '../rss-importer.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DailyPublisherTask {
  private readonly logger = new Logger(DailyPublisherTask.name);
  private readonly importDir = path.join(process.cwd(), 'imports', 'rss');

  constructor(private rssImporter: RSSImporterService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyImport() {
    this.logger.log('Running daily publisher import task...');

    if (!fs.existsSync(this.importDir)) {
      this.logger.warn(`Import directory ${this.importDir} does not exist.`);
      return;
    }

    const files = fs.readdirSync(this.importDir);
    const rssFiles = files.filter(
      (file) => file.endsWith('.xml') || file.endsWith('.rss'),
    );

    this.logger.log(`Found ${rssFiles.length} files to process.`);

    for (const file of rssFiles) {
      await this.rssImporter.importFromRSSFile(path.join(this.importDir, file));
    }

    this.logger.log('Daily publisher import task completed.');
  }
}
