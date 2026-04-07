import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RSSEngineService } from '../rss-engine/rss-engine.service';
import { PrismaService } from '../prisma/prisma.service';

async function fixCategories() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rssService = app.get(RSSEngineService);
  const prisma = app.get(PrismaService);

  console.log('--- Starting Category Fix (Last 7 Days) ---');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const articles = await prisma.article.findMany({
    where: {
      postedAt: { gte: sevenDaysAgo },
    },
    orderBy: { postedAt: 'desc' },
    select: { id: true, title: true, synopsis: true, category: true },
  });

  console.log(`Found ${articles.length} articles to check.`);

  let updatedCount = 0;
  for (const article of articles) {
    // Only use keyword-based fix for speed, skip AI for this batch
    const newCategory = await rssService.mapCategory(
      '',
      article.title,
      article.synopsis || '',
      true,
    );

    if (newCategory !== article.category) {
      await prisma.article.update({
        where: { id: article.id },
        data: { category: newCategory },
      });
      updatedCount++;
      if (updatedCount % 50 === 0)
        console.log(`Updated ${updatedCount} article categories...`);
    }
  }

  console.log(`✅ Category fix COMPLETE. Updated ${updatedCount} articles.`);
  await app.close();
}

fixCategories();
