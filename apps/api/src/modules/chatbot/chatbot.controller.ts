import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ChatbotService } from './chatbot.service'

@Controller('chatbots')
export class ChatbotController {
  constructor(private chatbots: ChatbotService) {}

  private getOrgId(headers: Record<string, string>): string {
    const orgId = headers['x-org-id']
    if (!orgId) throw new UnauthorizedException('x-org-id header required')
    return orgId
  }

  @Get()
  findAll(@Headers() headers: Record<string, string>) {
    return this.chatbots.findAll(this.getOrgId(headers))
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers() headers: Record<string, string>) {
    return this.chatbots.findOne(id, this.getOrgId(headers))
  }

  @Post()
  create(@Headers() headers: Record<string, string>, @Body() dto: any) {
    return this.chatbots.create(this.getOrgId(headers), dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Headers() headers: Record<string, string>, @Body() dto: any) {
    return this.chatbots.update(id, this.getOrgId(headers), dto)
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @Headers() headers: Record<string, string>) {
    return this.chatbots.publish(id, this.getOrgId(headers))
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatbots.remove(id)
  }

  @Get(':id/knowledge')
  getKnowledge(@Param('id') id: string, @Headers() headers: Record<string, string>) {
    return this.chatbots.getKnowledge(id, this.getOrgId(headers))
  }

  @Post(':id/knowledge/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadDoc(@Param('id') id: string, @Headers() headers: Record<string, string>, @UploadedFile() file: Express.Multer.File) {
    const orgId = this.getOrgId(headers)
    let text = ''
    if (file.mimetype === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse')
        const parsed = await pdfParse(file.buffer)
        text = parsed.text
      } catch {
        text = file.buffer.toString('utf-8')
      }
    } else {
      text = file.buffer.toString('utf-8')
    }
    return this.chatbots.saveKnowledgeText(id, orgId, text, file.originalname)
  }

  @Post(':id/knowledge/url')
  addUrl(@Param('id') id: string, @Headers() headers: Record<string, string>, @Body() body: { url: string }) {
    return this.chatbots.addWebsiteUrl(id, this.getOrgId(headers), body.url)
  }

  @Delete(':id/knowledge/:index')
  removeDoc(@Param('id') id: string, @Param('index') index: string, @Headers() headers: Record<string, string>) {
    return this.chatbots.removeKnowledgeDoc(id, this.getOrgId(headers), parseInt(index))
  }

  @Get('knowledge/active')
  getActiveKnowledge(@Headers() headers: Record<string, string>) {
    return this.chatbots.getActiveKnowledge(this.getOrgId(headers))
  }
}
