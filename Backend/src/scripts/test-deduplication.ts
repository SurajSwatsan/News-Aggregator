import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AppService } from '../app.service';
import { PrismaService } from '../prisma/prisma.service';

async function testDeduplication() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appService = app.get(AppService);
  const prisma = app.get(PrismaService);

  console.log('--- Deduplication Test ---');

  try {
    // 1. Find or create a test source
    let source = await prisma.source.findFirst({
      where: { name: 'Test Source' },
    });
    if (!source) {
      source = await prisma.source.create({
        data: {
          name: 'Test Source',
          homepageUrl: 'https://example.com',
          isActive: true,
        },
      });
    }

    // 2. Create two similar articles
    const now = new Date();
    const article1 = await prisma.article.create({
      data: {
        title: 'Massive storm hits Mumbai, causing power outages',
        synopsis:
          'A severe cyclonic storm has lashed Mumbai with heavy rains and strong winds, leading to widespread power cuts and traffic disruptions across the city.',
        sourceUrl: 'https://news1.com/storm-mumbai-' + Date.now(),
        sourceId: source.id,
        postedAt: now,
        category: 'Weather',
        clusterId: 9999, // Using a large number to avoid conflicts
      },
    });

    console.log(
      `Created Article 1: ${article1.title} (Cluster: ${article1.clusterId})`,
    );

    // In a real sync, RSSEngineService would find the clusterId.
    // Here we'll simulate the second article from another source.
    const article2 = await prisma.article.create({
      data: {
        title:
          'Mumbai Storm: Heavy rain paralyzes city, power cut in many areas',
        synopsis:
          "Mumbaikars faced a tough day as a massive storm caused heavy rainfall, paralyzing the city's transport and causing power outages in several neighborhoods.",
        sourceUrl: 'https://news2.com/mumbai-weather-' + Date.now(),
        sourceId: source.id, // Usually different source, but for test same is fine
        postedAt: new Date(now.getTime() - 1000 * 60 * 5), // 5 mins older
        category: 'General',
        clusterId: 9999, // Grouping with article 1
      },
    });

    console.log(
      `Created Article 2: ${article2.title} (Cluster: ${article2.clusterId})`,
    );

    // 3. Fetch articles and check deduplication
    const articles = await appService.getPublicArticles();
    const cluster9999 = articles.filter((a) => a.clusterId === 9999);

    console.log(
      `Found ${cluster9999.length} article(s) for cluster 9999 in the feed.`,
    );

    if (cluster9999.length === 1) {
      console.log('✅ Success: Only one article from the cluster shown.');
      console.log(`Displayed Article: ${cluster9999[0].title}`);
      if (cluster9999[0].id === article1.id) {
        console.log('✅ Success: Most recent article preserved.');
      } else {
        console.log('❌ Failure: Older article preserved.');
      }
    } else {
      console.log(
        `❌ Failure: Expected 1 article, found ${cluster9999.length}.`,
      );
    }

    // Cleanup
    await prisma.article.deleteMany({ where: { clusterId: 9999 } });
    console.log('Cleaned up test articles.');
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
  } finally {
    await app.close();
  }
}

testDeduplication();
