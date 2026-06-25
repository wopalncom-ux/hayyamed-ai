import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { FeatureFlagsService } from './feature-flags.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private svc: FeatureFlagsService) {}

  // Get flags for current org (tenant view)
  @Get()
  async getForOrg(@CurrentUser() user: any) {
    return this.svc.getFlagsForOrg(user.orgId, 'GROWTH') // plan from org in real impl
  }

  // Check single flag
  @Get(':key')
  async check(@Param('key') key: string, @CurrentUser() user: any) {
    const enabled = await this.svc.isEnabled(key, user.orgId, 'GROWTH')
    return { key, enabled }
  }
}

@UseGuards(OwnerGuard)
@Controller('master-admin/feature-flags')
export class AdminFeatureFlagsController {
  constructor(private svc: FeatureFlagsService) {}

  // Get all flags (global view)
  @Get()
  getAll() {
    return this.svc.getFlags()
  }

  // Update global flag
  @Patch(':key')
  update(@Param('key') key: string, @Body() body: { isEnabled?: boolean; minPlan?: string; isBeta?: boolean }) {
    return this.svc.updateFlag(key, body)
  }

  // Set per-org override
  @Post('orgs/:orgId/:key')
  setOverride(
    @Param('orgId') orgId: string,
    @Param('key') key: string,
    @Body() body: { isEnabled: boolean },
  ) {
    return this.svc.setOrgOverride(orgId, key, body.isEnabled)
  }

  // Remove per-org override
  @Delete('orgs/:orgId/:key')
  removeOverride(@Param('orgId') orgId: string, @Param('key') key: string) {
    return this.svc.removeOrgOverride(orgId, key)
  }

  // Get all overrides for an org
  @Get('orgs/:orgId')
  getOrgOverrides(@Param('orgId') orgId: string) {
    return this.svc.getOrgOverrides(orgId)
  }
}
