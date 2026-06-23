import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { ConversationsService } from './conversations.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('conversations')
export class ConversationsController {
  constructor(private conversations: ConversationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversations.findAll(user.orgId, {
      status, search,
      page: page ? +page : 1,
      limit: limit ? +limit : 30,
    })
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.conversations.getStats(user.orgId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversations.findOne(id, user.orgId)
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.conversations.getMessages(id)
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { content: string },
  ) {
    return this.conversations.sendMessage(id, body.content, user.sub)
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.conversations.updateStatus(id, body.status)
  }
}
