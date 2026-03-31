import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function checkZee() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const articles = await prisma.article.findMany({
    where: { sourceUrl: { contains: 'zeenews.india.com' } },
    include: { source: true },
    take: 5
  });
  
  console.log(`Found ${articles.length} articles matching Zee News URL.`);
  articles.forEach(a => {
    console.log(`- Title: ${a.title}`);
    console.log(`  Source: ${a.source.name} (ID: ${a.sourceId})`);
  });

  await app.close();
}

checkZee().catch(console.error);
