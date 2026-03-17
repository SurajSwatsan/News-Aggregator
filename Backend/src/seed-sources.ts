import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function seedSources() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const initialSources = [
    {
      name: 'Times of India',
      homepageUrl: 'https://timesofindia.indiatimes.com/india',
      isActive: true,
      scrapingInterval: 60,
    },
    {
      name: 'Hindustan Times',
      homepageUrl: 'https://www.hindustantimes.com/india-news',
      isActive: true,
      scrapingInterval: 60,
    },
    {
      name: 'Indian Express',
      homepageUrl: 'https://indianexpress.com/section/india/',
      isActive: true,
      scrapingInterval: 60,
    },
  ];

  for (const s of initialSources) {
    const exists = await prisma.source.findFirst({ where: { name: s.name } });
    if (!exists) {
      await prisma.source.create({ data: s });
      console.log(`✅ Added Source: ${s.name}`);
    }
  }

  await app.close();
}

seedSources();
