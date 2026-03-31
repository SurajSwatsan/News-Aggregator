import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RSSEngineService } from '../rss-engine/rss-engine.service';

async function debugSyncById() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rssEngine = app.get(RSSEngineService);

  const sourceId = '25ee8edd-346f-4f9f-b1c7-dffbb588674d'; // Zee News

  console.log(`Starting debug sync for Zee News (ID: ${sourceId})...`);
  const count = await rssEngine.syncRSSNews(sourceId);
  console.log(`Sync finished. Added ${count} articles.`);

  await app.close();
}

debugSyncById().catch(console.error);
