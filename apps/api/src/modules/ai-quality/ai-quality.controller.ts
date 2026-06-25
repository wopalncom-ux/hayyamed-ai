import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common'
import { AIQualityService } from './ai-quality.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Controller('ai/quality')
export class AIQualityController {
  constructor(private svc: AIQualityService) {}

  @Get()
  getOrgQuality(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.svc.getOrgQuality(user.orgId, days ? parseInt(days) : 30)
  }
}

@UseGuards(OwnerGuard)
@Controller('master-admin/ai-quality')
export class AdminAIQualityController {
  constructor(private svc: AIQualityService) {}

  @Get()
  getPlatformQuality(@Query('days') days?: string) {
    return this.svc.getPlatformQuality(days ? parseInt(days) : 30)
  }

  @Get('orgs')
  getAllOrgQuality(@Query('days') days?: string) {
    return this.svc.getAllQuality(days ? parseInt(days) : 30)
  }

  @Get('orgs/:orgId')
  getOrgQuality(@Param('orgId') orgId: string, @Query('days') days?: string) {
    return this.svc.getOrgQuality(orgId, days ? parseInt(days) : 30)
  }
}
