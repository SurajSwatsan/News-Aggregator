import { Controller, Get, Put, Patch, Delete, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { AdService } from '../ad/ad.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PublisherGuard } from '../auth/publisher.guard';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('publisher')
@UseGuards(JwtAuthGuard, PublisherGuard)
export class PublisherController {
  constructor(
    private readonly publisherService: PublisherService,
    private readonly adService: AdService
  ) {}

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    const userId = req.user.id; 
    return this.publisherService.getDashboardStats(userId);
  }

  @Get('articles')
  async getArticles(@Request() req: any, @Query('search') search?: string) {
    const userId = req.user.id;
    return this.publisherService.getArticles(userId, search);
  }

  @Get('analytics')
  async getAnalytics(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getTrafficAnalytics(userId);
  }

  @Get('revenue')
  async getRevenue(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getRevenueStats(userId);
  }

  @Get('source')
  async getSource(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getSourceDetails(userId);
  }

  @Put('source')
  async updateSource(@Request() req: any, @Body() data: any) {
    const userId = req.user.id;
    return this.publisherService.updateSourceDetails(userId, data);
  }

  @Get('feeds')
  async getFeeds(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.getFeeds(userId);
  }

  @Post('feeds')
  async addFeed(@Request() req: any, @Body('url') url: string) {
    const userId = req.user.id;
    return this.publisherService.addFeed(userId, url);
  }

  @Post('articles')
  async createArticle(@Request() req: any, @Body() data: any) {
    const userId = req.user.id;
    return this.publisherService.createArticle(userId, data);
  }

  @Post('sync')
  async sync(@Request() req: any) {
    const userId = req.user.id;
    return this.publisherService.triggerSync(userId);
  }

  @Get('ads')
  async getMyAds(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('search') search?: string
  ) {
    return this.adService.getPublisherAds(req.user.id, type, search);
  }

  @Post('ads')
  async createMyAd(@Request() req: any, @Body() data: any) {
    return this.adService.createAd(data, req.user.id);
  }

  @Patch('ads/:id')
  async updateMyAd(@Param('id') id: string, @Body() data: any) {
    // Note: We could add ownership check here if needed, 
    // but the adService.updateAd will just update by ID.
    return this.adService.updateAd(id, data);
  }

  @Delete('ads/:id')
  async deleteMyAd(@Param('id') id: string) {
    return this.adService.deleteAd(id);
  }

  @Post('upload-doc')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req: any, file: any, cb: any) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadDoc(@UploadedFile() file: any) {
    return {
      filename: file.filename,
      url: `http://localhost:3000/uploads/${file.filename}`
    };
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
