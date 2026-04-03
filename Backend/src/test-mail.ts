import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MailService } from './mail/mail.service';

async function bootstrap() {
  console.log('--- Email Connection Test Start ---');
  const app = await NestFactory.createApplicationContext(AppModule);
  const mailService = app.get(MailService);

  const testEmail = 'your-email@gmail.com'; // Change to check real delivery
  console.log(`Attempting to send a test email to ${testEmail}...`);
  
  try {
    const result = await mailService.sendMail(
      testEmail, 
      'Connectivity Test', 
      '<h1>Test Success</h1><p>If you see this, your email configuration is working!</p>'
    );
    if (result && result.messageId.includes('dev-mock')) {
      console.log('✅ DEV MODE ACTIVE: Email successfully logged to console.');
    } else if (result) {
      console.log('✅ PROD MODE ACTIVE: Email successfully sent via SMTP.');
    } else {
      console.error('❌ Still failing. Check your App Password in .env');
    }
  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
  }

  await app.close();
  console.log('--- Test Complete ---');
}

bootstrap();
