import { Module } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublisherController } from './publisher.controller';
import { RSSImporterService } from './rss-importer.service';
import { DailyPublisherTask } from './tasks/daily-publisher.task';
import { RSSEngineModule } from '../rss-engine/rss-engine.module';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bullmq';
import { SyncGateway } from './sync.gateway';
import { SyncProcessor } from './sync.processor';
import { AdModule } from '../ad/ad.module';

@Module({
  imports: [
    RSSEngineModule,
    AdModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    BullModule.registerQueue({
      name: 'sync-articles',
    }),
  ],
  controllers: [PublisherController],
  providers: [
    PublisherService, 
    RSSImporterService, 
    DailyPublisherTask,
    SyncGateway,
    SyncProcessor
  ],
  exports: [PublisherService, RSSImporterService],
})
export class PublisherModule {}
