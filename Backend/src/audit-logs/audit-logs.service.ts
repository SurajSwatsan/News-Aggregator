import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/pagination.dto';

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

  async getAllLogs(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (this.prisma as any).auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).auditLog.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
