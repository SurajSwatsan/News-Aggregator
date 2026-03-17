import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('sources')
  async getAllSources() {
    return this.prisma.source.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            email: true,
            orgName: true
          }
        }
      }
    });
  }

  @Get('stats')
  async getGlobalStats() {
    const totalArticles = await this.prisma.article.count();
    const totalSources = await this.prisma.source.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sourcesAddedToday = await this.prisma.source.count({
      where: {
        createdAt: { gte: today }
      }
    });

    return {
      totalArticles,
      totalSources,
      sourcesAddedToday
    };
  }
}
