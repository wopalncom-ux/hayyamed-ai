import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { AIAgentsService } from './ai-agents.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('ai-agents')
export class AIAgentsController {
  constructor(private svc: AIAgentsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.svc.findAll(user.orgId)
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

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.remove(id, user.orgId)
  }

  @Post(':id/toggle')
  toggle(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { isActive: boolean }) {
    return this.svc.toggle(id, user.orgId, body.isActive)
  }

  // Test the agent live: send it a message, get its reply using its config + knowledge base
  @Post(':id/test')
  test(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { message: string; history?: { role: 'user' | 'assistant'; content: string }[] },
  ) {
    return this.svc.runAgent(id, user.orgId, body.message, body.history || [])
  }
}
