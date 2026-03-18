import { Module } from '@nestjs/common';
import { RSSEngineService } from './rss-engine.service';
import { RSSSyncTask } from './tasks/rss-sync.task';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [RSSEngineService, RSSSyncTask],
  exports: [RSSEngineService],
})
export class RSSEngineModule {}
