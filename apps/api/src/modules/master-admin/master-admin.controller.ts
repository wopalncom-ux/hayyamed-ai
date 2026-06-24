import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { MasterAdminService } from './master-admin.service'
import { EmailService } from '../email/email.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('master-admin')
export class MasterAdminController {
  constructor(private svc: MasterAdminService, private email: EmailService) {}

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

  @Post('email/test')
  async testEmail(@CurrentUser() user: JwtPayload, @Body() body: { to: string; template: string }) {
    const to = body.to || 'test@hayyaai.com'
    const template = body.template || 'welcome'

    const results: Record<string, any> = {}
    if (template === 'welcome' || template === 'all') {
      results.welcome = await this.email.sendWelcome(to, { name: 'Test User', orgName: 'Acme Clinic', loginUrl: 'https://www.hayyaai.com/dashboard' })
    }
    if (template === 'passwordReset' || template === 'all') {
      results.passwordReset = await this.email.sendPasswordReset(to, { name: 'Test User', resetUrl: 'https://www.hayyaai.com/reset-password?token=test', expiresIn: '1 hour' })
    }
    if (template === 'invite' || template === 'all') {
      results.invite = await this.email.sendInvite(to, { inviterName: 'Abbas Al Masri', orgName: 'Hayya AI', role: 'Agent', acceptUrl: 'https://www.hayyaai.com/invite/accept?token=test' })
    }
    if (template === 'billing' || template === 'all') {
      results.billing = await this.email.sendSubscriptionConfirmed(to, { name: 'Test User', plan: 'Growth', nextBillingDate: '24 July 2026', dashboardUrl: 'https://www.hayyaai.com/dashboard' })
    }
    return { sent: true, to, results }
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
