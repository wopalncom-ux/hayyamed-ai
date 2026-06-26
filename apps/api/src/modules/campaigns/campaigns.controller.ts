import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UnauthorizedException } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { Public } from '../../common/decorators/public.decorator'

@Controller('campaigns')
export class CampaignsController {
  constructor(private campaigns: CampaignsService) {}

  // ─── LIST / CRUD ─────────────────────────────────────────────────────────

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.campaigns.findAll(user.orgId, {
      status, page: page ? +page : 1, limit: limit ? +limit : 20,
    })
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.campaigns.getStats(user.orgId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.findOne(id, user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.campaigns.create(user.orgId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.campaigns.update(id, user.orgId, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.remove(id, user.orgId)
  }

  // ─── CONTACT MANAGEMENT ──────────────────────────────────────────────────

  @Get(':id/contacts')
  getContacts(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.campaigns.getContacts(id, user.orgId, page ? +page : 1, limit ? +limit : 50)
  }

  @Post(':id/contacts')
  addContacts(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { contactIds: string[] }) {
    return this.campaigns.addContacts(id, user.orgId, body.contactIds)
  }

  @Post(':id/contacts/filter')
  addByFilter(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: {
    status?: string; source?: string; tag?: string; search?: string; all?: boolean
  }) {
    return this.campaigns.addContactsByFilter(id, user.orgId, body)
  }

  @Delete(':id/contacts/:contactId')
  removeContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.campaigns.removeContact(id, user.orgId, contactId)
  }

  // ─── EXECUTION ───────────────────────────────────────────────────────────

  @Post(':id/launch')
  launch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.launch(id, user.orgId)
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.pause(id, user.orgId)
  }

  @Post(':id/resume')
  resume(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.resume(id, user.orgId)
  }

  @Post(':id/schedule')
  schedule(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { scheduledAt: string }) {
    return this.campaigns.schedule(id, user.orgId, body.scheduledAt)
  }

  @Get(':id/analytics')
  analytics(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.getAnalytics(id, user.orgId)
  }

  // ─── CRON ENDPOINT (Cloud Scheduler calls this) ──────────────────────────

  @Public()
  @Post('cron/process-scheduled')
  processDue(@Query('secret') secret: string) {
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) throw new UnauthorizedException()
    return this.campaigns.processDueCampaigns()
  }
}
