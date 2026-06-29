import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { WebchatService } from './webchat.service'
import { Public } from '../../common/decorators/public.decorator'

// Public website-chat endpoints — embedded widget talks to these.
// Tighter throttle than global to limit abuse from public origins.
@Public()
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('webchat')
export class WebchatController {
  constructor(private svc: WebchatService) {}

  @Post(':orgId/message')
  message(
    @Param('orgId') orgId: string,
    @Body() body: { sessionId: string; text: string; name?: string; utm?: { source?: string; campaign?: string; medium?: string }; page?: string },
  ) {
    const { sessionId, text, name, utm, page } = body || {}
    if (!sessionId || !text) {
      throw new BadRequestException('sessionId and text are required')
    }
    return this.svc.receiveMessage(orgId, sessionId, text, name, { utm, page })
  }

  @Get(':orgId/session/:sessionId')
  session(@Param('orgId') orgId: string, @Param('sessionId') sessionId: string) {
    return this.svc.getSession(orgId, sessionId)
  }
}
