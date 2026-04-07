import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) { }

  @Get()
  async getLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.auditLogsService.getAllLogs(parseInt(page), parseInt(limit));
  }
}
