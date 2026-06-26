import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseInterceptors, UploadedFile, Res, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { ContactsService } from './contacts.service'
import { ContactsImportService } from './contacts-import.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('contacts')
export class ContactsController {
  constructor(
    private contacts: ContactsService,
    private importer: ContactsImportService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contacts.findAll(user.orgId, {
      search, status,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
    })
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.contacts.getStats(user.orgId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contacts.findOne(id, user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.contacts.create(user.orgId, dto)
  }

  @Post('bulk')
  bulk(@CurrentUser() user: JwtPayload, @Body() body: { ids: string[]; action: string; value?: string }) {
    const { ids, action, value } = body || ({} as any)
    if (!Array.isArray(ids) || ids.length === 0 || !action) {
      throw new BadRequestException('ids[] and action are required')
    }
    return this.contacts.bulk(user.orgId, ids, action, value)
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.contacts.update(id, user.orgId, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contacts.remove(id, user.orgId)
  }

  // ─── PIPELINE ─────────────────────────────────────────────────────────────

  @Get('pipeline')
  getPipeline(
    @CurrentUser() user: JwtPayload,
    @Query('source') source?: string,
    @Query('search') search?: string,
  ) {
    return this.contacts.getPipelineContacts(user.orgId, { source, search })
  }

  // ─── PROFILE / NOTES ─────────────────────────────────────────────────────

  @Get(':id/profile')
  getProfile(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contacts.getProfile(id, user.orgId)
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { content: string },
  ) {
    return this.contacts.addNote(id, user.orgId, user.sub, body.content)
  }

  @Delete(':id/notes/:noteId')
  deleteNote(@Param('noteId') noteId: string, @CurrentUser() user: JwtPayload) {
    return this.contacts.deleteNote(noteId, user.sub)
  }

  // ─── IMPORT ──────────────────────────────────────────────────────────────

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async preview(@UploadedFile() file: Express.Multer.File, @CurrentUser() _user: JwtPayload) {
    if (!file) throw new BadRequestException('No file uploaded')
    return this.importer.preview(file.buffer, file.originalname)
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
    @Body('mapping') rawMapping: string,
    @Body('overwriteDuplicates') overwrite: string,
    @Body('defaultSource') defaultSource: string,
    @Body('defaultStatus') defaultStatus: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded')
    let mapping: any
    try { mapping = JSON.parse(rawMapping) } catch { throw new BadRequestException('Invalid mapping JSON') }
    if (!mapping.name) throw new BadRequestException('Mapping must include a "name" column')

    return this.importer.import(
      user.orgId, user.sub,
      file.buffer, file.originalname,
      mapping,
      { overwriteDuplicates: overwrite === 'true', defaultSource, defaultStatus },
    )
  }

  // ─── EXPORT ──────────────────────────────────────────────────────────────

  @Get('export/csv')
  async exportCsv(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const csv = await this.importer.exportCsv(user.orgId, { status, search })
    const filename = `contacts-${new Date().toISOString().split('T')[0]}.csv`
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })
    res.send(csv)
  }
}
