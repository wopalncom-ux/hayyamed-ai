import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common'
import { KnowledgeBaseService } from './knowledge-base.service'
import { RagService } from './rag.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('knowledge-bases')
export class KnowledgeBaseController {
  constructor(
    private svc: KnowledgeBaseService,
    private rag: RagService,
  ) {}

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
  async addSource(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    const source = await this.svc.addSource(id, user.orgId, dto)
    // Trigger async indexing — don't await so response is immediate
    if (source?.id && dto.content) {
      this.rag.indexSource(source.id).catch(() => {})
    }
    return source
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
  async reindex(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.svc.reindex(id, user.orgId)
    // Fetch sources to reindex async
    const kb = await this.svc.findOne(id, user.orgId)
    for (const s of kb.sources) {
      this.rag.indexSource(s.id).catch(() => {})
    }
    return { message: `Reindexing ${kb.sources.length} sources`, kbId: id }
  }

  @Post(':id/search')
  async search(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { query: string; topK?: number }) {
    const chunks = await this.rag.semanticSearch(user.orgId, id, body.query, body.topK || 5)
    return { results: chunks, count: chunks.length }
  }
}
