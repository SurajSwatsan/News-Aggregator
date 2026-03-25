import { Controller, Get, Post, Body, Param, Put, Patch, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdService } from '../ad/ad.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private adService: AdService
  ) {}

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

  @Get('ads')
  async getAllAds() {
    return this.adService.getAllAds();
  }

  @Post('ads')
  async createAd(@Body() data: any) {
    return this.adService.createAd(data, 'ADMIN');
  }

  @Put('ads/:id/status')
  async updateAdStatus(@Param('id') id: string, @Body() data: { status: string, isActive: boolean }) {
    return this.adService.updateAdStatus(id, data.status, data.isActive);
  }

  @Patch('ads/:id')
  async updateAd(@Param('id') id: string, @Body() data: any) {
    return this.adService.updateAd(id, data);
  }

  @Delete('ads/:id')
  async deleteAd(@Param('id') id: string) {
    return this.adService.deleteAd(id);
  }

  @Post('ads/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req: any, file: any, cb: any) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadFile(@UploadedFile() file: any) {
    return {
      url: `http://localhost:3000/uploads/${file.filename}`
    };
  }
}
