import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AccessLogsService } from './access-logs.service';

@Controller('access-logs')
export class AccessLogsController {
  constructor(private readonly accessLogsService: AccessLogsService) {}

  @Get(':userId/:articleId')
  async checkAccess(
    @Param('userId') userId: string,
    @Param('articleId') articleId: string,
  ) {
    return this.accessLogsService.checkAccess(userId, articleId);
  }

  @Post()
  async grantAccess(@Body() body: { userId: string, articleId: string }) {
    return this.accessLogsService.grantAccess(body.userId, body.articleId);
  }
}
