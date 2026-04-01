import { Module } from '@nestjs/common';
import { SubscriptionPlanService } from './service';
import { SubscriptionPlanController } from './controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionPlanController],
  providers: [SubscriptionPlanService],
  exports: [SubscriptionPlanService],
})
export class SubscriptionPlanModule {}
