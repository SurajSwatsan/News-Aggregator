import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function listAllSources() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const sources = await prisma.source.findMany({
    include: { owner: true },
  });

  console.log(`--- Total Sources: ${sources.length} ---`);
  sources.forEach((s) => {
    console.log(
      `ID: ${s.id} | Name: ${s.name} | URL: ${s.rssUrl} | Owner: ${s.owner?.email || 'N/A'}`,
    );
  });

  await app.close();
}

listAllSources().catch(console.error);
