import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function fixNames() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('--- One-time Fix: Updating Publisher Names ---');
  
  const publishers = await prisma.user.findMany({
    where: { role: 'publisher' }
  });
  
  console.log(`Found ${publishers.length} publishers.`);
  
  for (const p of publishers) {
    if (p.orgName && p.name !== p.orgName) {
      console.log(`Updating ${p.name} -> ${p.orgName}`);
      await prisma.user.update({
        where: { id: p.id },
        data: { name: p.orgName }
      });
    }
  }
  
  console.log('--- Fix Complete ---');
  await app.close();
}

fixNames().catch(console.error);
