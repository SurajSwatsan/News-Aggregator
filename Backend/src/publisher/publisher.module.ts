import { Module } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublisherController } from './publisher.controller';
import { RSSImporterService } from './rss-importer.service';
import { DailyPublisherTask } from './tasks/daily-publisher.task';

@Module({
  controllers: [PublisherController],
  providers: [PublisherService, RSSImporterService, DailyPublisherTask],
  exports: [PublisherService, RSSImporterService],
})
export class PublisherModule {}
