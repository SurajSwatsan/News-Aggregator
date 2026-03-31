import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RSSEngineService } from '../rss-engine/rss-engine.service';
import { PrismaService } from '../prisma/prisma.service';

async function debugSync() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rssEngine = app.get(RSSEngineService);
  const prisma = app.get(PrismaService);

  const source = await prisma.source.findFirst({
    where: { rssUrl: 'https://zeenews.india.com/rss/india-national-news.xml' }
  });

  if (!source) {
    console.log('Source not found for Zee News');
    await app.close();
    return;
  }

  console.log(`Starting debug sync for source ${source.id}...`);
  const count = await rssEngine.syncRSSNews(source.id);
  console.log(`Sync finished. Added ${count} articles.`);

  await app.close();
}

debugSync().catch(console.error);
