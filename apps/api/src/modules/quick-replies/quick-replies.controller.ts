import { Controller, Get, Post, Patch, Delete, Body, Param, BadRequestException } from '@nestjs/common'
import { QuickRepliesService } from './quick-replies.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private svc: QuickRepliesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.svc.list(user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: { title: string; content: string }) {
    const { title, content } = body || {}
    if (!title || !content) {
      throw new BadRequestException('title and content are required')
    }
    return this.svc.create(user.orgId, { title: title.trim(), content })
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { title?: string; content?: string }) {
    return this.svc.update(user.orgId, id, body || {})
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.remove(user.orgId, id)
  }
}
