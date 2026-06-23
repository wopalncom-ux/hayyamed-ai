import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common'
import { KnowledgeBaseService } from './knowledge-base.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('knowledge-bases')
export class KnowledgeBaseController {
  constructor(private svc: KnowledgeBaseService) {}

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

  @Post(':id/sources')
  addSource(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.svc.addSource(id, user.orgId, dto)
  }

  @Delete(':id/sources/:sourceId')
  removeSource(
    @Param('id') id: string,
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.svc.removeSource(id, sourceId, user.orgId)
  }

  @Post(':id/reindex')
  reindex(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.reindex(id, user.orgId)
  }
}
