import { Module } from '@nestjs/common';
import { RSSEngineService } from './rss-engine.service';
import { RSSSyncTask } from './tasks/rss-sync.task';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RSSEngineService, RSSSyncTask],
  exports: [RSSEngineService],
})
export class RSSEngineModule {}
