import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RSSEngineService } from '../rss-engine/rss-engine.service';
import { PrismaService } from '../prisma/prisma.service';

async function retroCluster() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // Access private findClusterId via any cast for this maintenance task
  const rssService = app.get(RSSEngineService) as any;
  const prisma = app.get(PrismaService);

  console.log('--- Starting Retroactive Clustering ---');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const articles = await prisma.article.findMany({
    where: { 
      clusterId: null,
      postedAt: { gte: sevenDaysAgo }
    },
    orderBy: { postedAt: 'desc' }
  });

  console.log(`Found ${articles.length} articles without a clusterId.`);

  let updatedCount = 0;
  for (const article of articles) {
    try {
      const clusterId = await rssService.findClusterId(article.title, article.synopsis || '');
      const category = await rssService.mapCategory('', article.title, article.synopsis || '', true);
      
      await prisma.article.update({
        where: { id: article.id },
        data: { 
          clusterId,
          category
        }
      });
      updatedCount++;
      if (updatedCount % 10 === 0) console.log(`Updated ${updatedCount} articles...`);
    } catch (err) {
      console.error(`Failed to cluster article ${article.id}: ${err.message}`);
    }
  }

  console.log(`✅ Retro-clustering COMPLETE. Updated ${updatedCount} articles.`);
  await app.close();
}

retroCluster();
