import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UnauthorizedException } from '@nestjs/common'
import { WorkflowsService } from './workflows.service'
import { WorkflowEngineService } from './workflow-engine.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { Public } from '../../common/decorators/public.decorator'

@Controller('workflows')
export class WorkflowsController {
  constructor(
    private svc: WorkflowsService,
    private engine: WorkflowEngineService,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.svc.findAll(user.orgId)
  }

  @Get('stats')
  stats(@CurrentUser() user: JwtPayload) {
    return this.engine.getStats(user.orgId)
  }

  @Get('runs')
  getRuns(
    @CurrentUser() user: JwtPayload,
    @Query('workflowId') workflowId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.engine.getRuns(user.orgId, workflowId, page ? +page : 1, limit ? +limit : 50)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.findOne(id, user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.svc.create(user.orgId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.svc.update(id, user.orgId, dto)
  }

  @Post(':id/toggle')
  toggle(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { isActive: boolean }) {
    return this.svc.toggle(id, user.orgId, body.isActive)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.remove(id, user.orgId)
  }

  // ─── Test fire a workflow manually ───────────────────────────────────────

  @Post(':id/test')
  async testFire(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { contactId?: string },
  ) {
    const wf = await this.svc.findOne(id, user.orgId)
    await this.engine.fire(user.orgId, wf.trigger, body.contactId)
    return { fired: true }
  }

  // ─── CRON ────────────────────────────────────────────────────────────────

  @Public()
  @Post('cron/process-pending')
  processPending(@Query('secret') secret: string) {
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) throw new UnauthorizedException()
    return this.engine.processPending()
  }
}
