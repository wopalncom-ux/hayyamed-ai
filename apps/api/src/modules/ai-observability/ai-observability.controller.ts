import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common'
import { AIObservabilityService } from './ai-observability.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { OwnerGuard } from '../../common/guards/owner.guard'

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

@UseGuards(OwnerGuard)
@Controller('master-admin/ai-observability')
export class AdminAIObservabilityController {
  constructor(private svc: AIObservabilityService) {}

  @Get('stats')
  getMasterStats(@Query('days') days?: string) {
    return this.svc.getMasterStats(days ? parseInt(days) : 30)
  }
}
