import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
  }) {
    return await (this.prisma as any).notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    });
  }

  async getNotifications(userId: string) {
    return await (this.prisma as any).notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Only last 20 notifications
    });
  }

  async markAsRead(id: string) {
    return await (this.prisma as any).notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return await (this.prisma as any).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getNotificationsHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (this.prisma as any).notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).notification.count({
        where: { userId },
      }),
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
