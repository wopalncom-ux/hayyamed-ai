import { Controller, Get, Query } from '@nestjs/common'
import { AuditService } from './audit.service'
import { CurrentUser } from '../../common/decorators/user.decorator'

@Controller('audit')
export class AuditController {
  constructor(private svc: AuditService) {}

  @Get()
  getOrgLogs(
    @CurrentUser() user: any,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getOrgLogs(user.orgId, {
      action, userId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    })
  }
}

@Controller('master-admin/audit')
export class AdminAuditController {
  constructor(private svc: AuditService) {}

  @Get()
  getPlatformLogs(
    @Query('action') action?: string,
    @Query('orgId') orgId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getPlatformLogs({
      action, orgId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 100,
    })
  }

  @Get('stats')
  getStats(@Query('days') days?: string) {
    return this.svc.getPlatformStats(days ? parseInt(days) : 30)
  }
}
