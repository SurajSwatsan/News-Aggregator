import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async createLog(data: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: any;
  }) {
    try {
      return await (this.prisma as any).auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          metadata: data.metadata || {},
        },
      });
    } catch (e) {
      console.error('[AuditLogsService] Failed to create log:', e);
      // Fail silently to not break the main transaction if logging fails
      return null;
    }
  }

  async getAllLogs() {
    return await (this.prisma as any).auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for now
    });
  }
}
