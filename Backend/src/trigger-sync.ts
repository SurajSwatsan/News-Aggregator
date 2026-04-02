import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RSSEngineService } from './rss-engine/rss-engine.service';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  console.log('--- Manual RSS Sync Verification Job Start ---');
  const app = await NestFactory.createApplicationContext(AppModule);
  const rssService = app.get(RSSEngineService);
  const prisma = app.get(PrismaService);

  const activeSources = await prisma.source.findMany({
    where: { isActive: true }
  });

  console.log(`Manually triggering sync for ${activeSources.length} active sources...`);

  for (const source of activeSources) {
    console.log(`Syncing: ${source.name}...`);
    try {
      const count = await rssService.syncRSSNews(source.id);
      console.log(`✅ Success for ${source.name}: Added ${count} articles.`);
    } catch (err) {
      console.error(`❌ Still failing for ${source.name}: ${err.message}`);
    }
  }

  await app.close();
  console.log('--- Manual Verification Job Complete ---');
}

bootstrap();
