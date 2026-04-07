import { Controller, Get, UseGuards, Request, Patch, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Request() req: any) {
    return this.notificationService.getNotifications(req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Get('history')
  async getNotificationsHistory(
    @Request() req: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.notificationService.getNotificationsHistory(
      req.user.id,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
  }
}
