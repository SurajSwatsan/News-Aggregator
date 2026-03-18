import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function checkConfig() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  
  const jwtSecret = configService.get('JWT_SECRET');
  const dbUrl = configService.get('DATABASE_URL');
  
  console.log('--- CONFIG CHECK ---');
  console.log(`JWT_SECRET: ${jwtSecret ? 'DEFINED (Length: ' + jwtSecret.length + ')' : 'UNDEFINED'}`);
  console.log(`DATABASE_URL: ${dbUrl ? 'DEFINED' : 'UNDEFINED'}`);
  console.log('--------------------');
  
  await app.close();
}

checkConfig().catch(console.error);
