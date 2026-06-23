import { Controller, Get, Post, Patch, Delete, Body, Param, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ChatbotService } from './chatbot.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('chatbots')
export class ChatbotController {
  constructor(private chatbots: ChatbotService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.chatbots.findAll(user.orgId)
  }

  @Get('knowledge/active')
  getActiveKnowledge(@CurrentUser() user: JwtPayload) {
    return this.chatbots.getActiveKnowledge(user.orgId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatbots.findOne(id, user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.chatbots.create(user.orgId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.chatbots.update(id, user.orgId, dto)
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatbots.publish(id, user.orgId)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatbots.remove(id)
  }

  @Get(':id/knowledge')
  getKnowledge(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatbots.getKnowledge(id, user.orgId)
  }

  @Post(':id/knowledge/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadDoc(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
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
    return this.chatbots.saveKnowledgeText(id, user.orgId, text, file.originalname)
  }

  @Post(':id/knowledge/url')
  addUrl(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { url: string }) {
    return this.chatbots.addWebsiteUrl(id, user.orgId, body.url)
  }

  @Delete(':id/knowledge/:index')
  removeDoc(@Param('id') id: string, @Param('index') index: string, @CurrentUser() user: JwtPayload) {
    return this.chatbots.removeKnowledgeDoc(id, user.orgId, parseInt(index))
  }
}
