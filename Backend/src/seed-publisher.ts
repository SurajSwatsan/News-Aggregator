import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function seedPublisher() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  // 1. Create Publisher User
  const publisherEmail = 'publisher@toi.com';
  const hashedPassword = await bcrypt.hash('publisher123', 10);

  let publisher = await prisma.user.findUnique({
    where: { email: publisherEmail },
  });
  if (!publisher) {
    publisher = await prisma.user.create({
      data: {
        email: publisherEmail,
        passwordHash: hashedPassword,
        role: UserRole.publisher,
        creditBalance: 0,
      },
    });
    console.log('✅ Publisher user created: publisher@toi.com / publisher123');
  }

  // 2. Link Times of India to this publisher
  const toi = await prisma.source.findFirst({
    where: { name: 'Times of India' },
  });
  if (toi) {
    await prisma.source.update({
      where: { id: toi.id },
      data: { ownerId: publisher.id },
    });
    console.log('✅ Times of India linked to publisher@toi.com');
  } else {
    console.log('❌ Times of India source not found. Run seed:sources first.');
  }

  await app.close();
}

seedPublisher();
