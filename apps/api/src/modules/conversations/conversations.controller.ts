import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UnauthorizedException } from '@nestjs/common'
import { ConversationsService } from './conversations.service'

@Controller('conversations')
export class ConversationsController {
  constructor(private conversations: ConversationsService) {}

  private getOrgId(headers: Record<string, string>): string {
    const orgId = headers['x-org-id']
    if (!orgId) throw new UnauthorizedException('x-org-id header required')
    return orgId
  }

  @Get()
  findAll(
    @Headers() headers: Record<string, string>,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = this.getOrgId(headers)
    return this.conversations.findAll(orgId, {
      status,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 30,
    })
  }

  @Get('stats')
  getStats(@Headers() headers: Record<string, string>) {
    const orgId = this.getOrgId(headers)
    return this.conversations.getStats(orgId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers() headers: Record<string, string>) {
    const orgId = this.getOrgId(headers)
    return this.conversations.findOne(id, orgId)
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.conversations.getMessages(id)
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body() body: { content: string; senderId?: string }) {
    return this.conversations.sendMessage(id, body.content, body.senderId)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.conversations.updateStatus(id, body.status)
  }
}
