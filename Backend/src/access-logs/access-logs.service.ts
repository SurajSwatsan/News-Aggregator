import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AccessLogsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async checkAccess(userId: string, articleId: string) {
    try {
      const log = await (this.prisma as any).accessLog.findUnique({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });
      return !!log;
    } catch (e) {
      // Fallback to safe template tag if Prisma client is out of sync
      const logs: any[] = await this.prisma.$queryRaw`
        SELECT id FROM access_logs 
        WHERE user_id = ${userId} AND article_id = ${articleId}
      `;
      return logs.length > 0;
    }
  }

  async grantAccess(userId: string, articleId: string) {
    // 1. Check for sufficient credits in existing schema
    const userResults: any[] = await this.prisma.$queryRaw`
      SELECT credit_balance::float as balance 
      FROM users 
      WHERE id = ${userId}
    `;

    if (!userResults || userResults.length === 0) {
      throw new Error('User not found');
    }

    const userData = userResults[0];

    if (userData.balance < 1) {
      return { success: false, message: 'Insufficient credits' };
    }

    try {
      // 2. Create access log using prisma client (preferred)
      await (this.prisma as any).accessLog.create({
        data: {
          userId,
          articleId,
        },
      });
    } catch (e) {
      // Fallback only if prisma client fails
      await this.prisma.$executeRaw`
        INSERT INTO access_logs (user_id, article_id) 
        VALUES (${userId}, ${articleId})
      `;
    }

    // 3. Deduct credit from user
    await this.prisma.$executeRaw`
      UPDATE users 
      SET credit_balance = credit_balance - 1 
      WHERE id = ${userId}
    `;

    await this.auditLogs.createLog({
      userId,
      action: 'ARTICLE_ACCESS',
      resourceType: 'ARTICLE',
      resourceId: articleId,
      metadata: { userId, articleId, cost: 1, type: 'CREDIT' },
    });

    return { success: true };
  }
}
