import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const adminEmail = 'admin@news.com';
  const adminPassword = 'admin123';

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Admin',
        passwordHash: hashedPassword,
        role: UserRole.admin,
        creditBalance: 1000,
      },
    });

    console.log('✅ SuperAdmin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } else {
    console.log('ℹ️ SuperAdmin user already exists.');
  }

  await app.close();
}

bootstrap();
