import { Controller, Get, Post, Delete, Body, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { KnowledgeBaseService } from './knowledge-base.service'
import { RagService } from './rag.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

import { extractText } from '../../common/util/extract-text.util'

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

  // Questions the AI couldn't answer from the knowledge base (declared before :id).
  @Get('gaps')
  listGaps(@CurrentUser() user: JwtPayload) {
    return this.rag.listGaps(user.orgId)
  }

  @Delete('gaps')
  clearGaps(@CurrentUser() user: JwtPayload) {
    return this.rag.clearGaps(user.orgId)
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
    // Trigger async indexing — don't await so response is immediate.
    // Covers text/FAQ (content) AND url sources (the worker fetches the page).
    if (source?.id && (dto.content || dto.url || dto.type === 'url')) {
      this.rag.indexSource(source.id).catch(() => {})
    }
    return source
  }

  // Upload a file (PDF/TXT/CSV/MD/JSON) → extract text → index into the knowledge base.
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  async upload(@Param('id') id: string, @CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded')
    let content = ''
    try {
      content = await extractText(file)
    } catch {
      throw new BadRequestException('Could not read this file. Supported: PDF, TXT, CSV, MD, JSON.')
    }
    if (!content.trim()) throw new BadRequestException('No readable text found in the file.')

    const source = await this.svc.addSource(id, user.orgId, {
      type: 'file',
      name: file.originalname || 'Uploaded file',
      content: content.slice(0, 200000), // cap to keep indexing fast
    })
    if (source?.id) this.rag.indexSource(source.id).catch(() => {})
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
