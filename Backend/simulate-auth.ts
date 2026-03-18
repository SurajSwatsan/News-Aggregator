import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AuthService } from './src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

async function simulateAuth() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const jwtService = app.get(JwtService);

  const email = 'namratapatil9942@gmail.com';
  // We don't have the password, but we can simulate the token generation
  // after finding the user.
  const prisma = (authService as any).prisma;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`User ${email} not found.`);
    await app.close();
    return;
  }

  console.log(`Simulating for user: ${user.email} | Role: ${user.role}`);

  const payload = { email: user.email, sub: user.id, role: user.role };
  const token = jwtService.sign(payload);
  console.log(`Generated Token: ${token}`);

  // Now let's try to "verify" this token using the SAME jwtService
  try {
    const verified = jwtService.verify(token);
    console.log('Token verified by JwtService:', verified);
  } catch (e) {
    console.error('Token verification failed by JwtService:', e.message);
  }

  // We can't easily test the Passport Strategy here without starting the full server,
  // but this confirms the sign/verify loop works with current config.
  
  await app.close();
}

simulateAuth().catch(console.error);
