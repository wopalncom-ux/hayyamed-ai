import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { MasterAdminService } from './master-admin.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('master-admin')
export class MasterAdminController {
  constructor(private svc: MasterAdminService) {}

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.svc.getPlatformStats(user.sub)
  }

  @Get('orgs')
  getAllOrgs(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getAllOrgs(user.sub, {
      search, plan,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    })
  }

  @Get('orgs/:id')
  getOrgDetails(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.getOrgDetails(user.sub, id)
  }

  @Patch('orgs/:id')
  updateOrg(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.svc.updateOrg(user.sub, id, dto)
  }

  @Post('orgs/:id/suspend')
  suspendOrg(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.suspendOrg(user.sub, id)
  }

  @Post('orgs')
  createOrg(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.svc.createOrg(user.sub, dto)
  }

  @Get('audit-logs')
  getAuditLogs(
    @CurrentUser() user: JwtPayload,
    @Query('orgId') orgId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getAuditLogs(user.sub, { orgId, page: page ? +page : 1, limit: limit ? +limit : 50 })
  }
}
