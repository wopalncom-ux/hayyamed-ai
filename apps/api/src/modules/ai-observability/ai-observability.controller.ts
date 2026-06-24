import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common'
import { AIObservabilityService } from './ai-observability.service'
import { CurrentUser } from '../../common/decorators/user.decorator'

@Controller('ai/observability')
export class AIObservabilityController {
  constructor(private svc: AIObservabilityService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.svc.getStats(user.orgId, days ? parseInt(days) : 30)
  }

  @Post('feedback/:id')
  feedback(@Param('id') id: string, @Body() body: { feedback: 'positive' | 'negative' }) {
    return this.svc.recordFeedback(id, body.feedback)
  }
}

@Controller('master-admin/ai-observability')
export class AdminAIObservabilityController {
  constructor(private svc: AIObservabilityService) {}

  @Get('stats')
  getMasterStats(@Query('days') days?: string) {
    return this.svc.getMasterStats(days ? parseInt(days) : 30)
  }
}
