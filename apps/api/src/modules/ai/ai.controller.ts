import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AIService } from './ai.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

// AI calls hit external LLM APIs and cost money — cap at 20 per IP per minute.
@Throttle({ default: { limit: 20, ttl: 60000 } })
@Controller('ai')
export class AIController {
  constructor(private ai: AIService) {}

  @Post('reply')
  async generateReply(
    @CurrentUser() user: JwtPayload,
    @Body() body: { conversationId: string },
  ) {
    if (!body.conversationId) throw new BadRequestException('conversationId required')
    const reply = await this.ai.generateReply(body.conversationId, user.orgId)
    return { reply }
  }

  @Post('score')
  async scoreLead(
    @CurrentUser() user: JwtPayload,
    @Body() body: { contactId: string },
  ) {
    if (!body.contactId) throw new BadRequestException('contactId required')
    return this.ai.scoreLead(body.contactId)
  }

  @Post('classify')
  async classifyIntent(@Body() body: { message: string }) {
    if (!body.message) throw new BadRequestException('message required')
    return this.ai.classifyIntent(body.message)
  }

  @Post('campaign-message')
  async generateCampaignMessage(
    @Body() body: { prompt: string; tone?: string; language?: string },
  ) {
    if (!body.prompt) throw new BadRequestException('prompt required')
    const message = await this.ai.generateCampaignMessage(
      body.prompt,
      body.tone || 'professional',
      body.language || 'ar',
    )
    return { message }
  }

  @Post('insights')
  async generateInsights(
    @CurrentUser() _user: JwtPayload,
    @Body() body: { metrics: Record<string, unknown> },
  ) {
    if (!body.metrics) throw new BadRequestException('metrics required')
    const insights = await this.ai.generateInsights(body.metrics)
    return { insights }
  }

  @Post('translate')
  async translate(@Body() body: { text: string; targetLang: 'ar' | 'en' }) {
    if (!body.text) throw new BadRequestException('text required')
    const translated = await this.ai.translate(body.text, body.targetLang || 'ar')
    return { translated }
  }

  @Get('providers')
  getProviders() {
    return this.ai.getProviderStatus()
  }
}
