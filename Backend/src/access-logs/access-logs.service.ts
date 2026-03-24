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
      // Fallback to raw SQL if Prisma client is out of sync
      const logs: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM access_logs WHERE user_id = $1 AND article_id = $2`,
        userId, articleId
      );
      return logs.length > 0;
    }
  }

  async grantAccess(userId: string, articleId: string) {
    try {
      // 1. Create access log
      await (this.prisma as any).accessLog.create({
        data: {
          userId,
          articleId,
        },
      });
    } catch (e) {
      // Fallback to raw SQL
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO access_logs (id, user_id, article_id, created_at) VALUES (gen_random_uuid(), $1, $2, NOW())`,
        userId, articleId
      );
    }

    // 2. Deduct credit from user
    await this.prisma.$executeRawUnsafe(
      `UPDATE users SET credit_balance = credit_balance - 1 WHERE id = $1`,
      userId
    );

    await this.auditLogs.createLog({
      userId,
      action: 'ARTICLE_ACCESS',
      resourceType: 'ARTICLE',
      resourceId: articleId,
      metadata: { userId, articleId, cost: 1 }
    });

    return { success: true };
  }
}
