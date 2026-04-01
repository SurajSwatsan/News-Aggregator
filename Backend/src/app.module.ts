import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RSSEngineModule } from './rss-engine/rss-engine.module';
import { AuthModule } from './auth/auth.module';
import { AccessLogsModule } from './access-logs/access-logs.module';
import { PublisherModule } from './publisher/publisher.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminController } from './admin/admin.controller';
import { AiModule } from './ai/ai.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AdModule } from './ad/ad.module';
import { MasterModule } from './master/master.module';
import { SubscriptionPlanModule } from './admin/subscription-plan/module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    AccessLogsModule,
    RSSEngineModule,
    PublisherModule,
    AiModule,
    OnboardingModule,
    MailModule,
    AuditLogsModule,
    AdModule,
    MasterModule,
    SubscriptionPlanModule,
  ],
  controllers: [AppController, AdminController],
  providers: [AppService],
})
export class AppModule {}
