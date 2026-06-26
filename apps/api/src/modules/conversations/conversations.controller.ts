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

  @Patch(':id/assign')
  assign(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { assigneeId: string | null }) {
    return this.conversations.assign(id, user.orgId, body.assigneeId)
  }

  @Patch(':id/tags')
  setTags(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { tags: string[] }) {
    return this.conversations.setTags(id, user.orgId, body.tags)
  }

  @Get(':id/notes')
  listNotes(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversations.listNotes(id, user.orgId)
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { content: string }) {
    return this.conversations.addNote(id, user.orgId, user.sub, body.content)
  }

  // AI summary of the conversation thread
  @Post(':id/summarize')
  summarize(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversations.summarize(id, user.orgId)
  }
}
