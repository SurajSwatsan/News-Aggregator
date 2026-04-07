import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RSSEngineService } from '../rss-engine/rss-engine.service';
import { SyncGateway } from './sync.gateway';
import { Logger } from '@nestjs/common';

@Processor('sync-articles')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private readonly rssEngine: RSSEngineService,
    private readonly syncGateway: SyncGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { sourceId } = job.data;
    this.logger.log(`Starting background sync for source: ${sourceId}`);

    try {
      const count = await this.rssEngine.syncRSSNews(sourceId);
      this.logger.log(
        `Sync complete for source: ${sourceId}. Added ${count} articles.`,
      );

      // Notify via WebSocket
      this.syncGateway.emitSyncComplete(sourceId);

      return { count };
    } catch (error) {
      this.logger.error(
        `Failed to process sync job for ${sourceId}: ${error.message}`,
      );
      throw error;
    }
  }
}
