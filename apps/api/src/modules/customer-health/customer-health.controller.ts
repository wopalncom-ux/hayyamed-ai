import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { CustomerHealthService } from './customer-health.service'
import { OwnerGuard } from '../../common/guards/owner.guard'

@UseGuards(OwnerGuard)
@Controller('master-admin/customer-health')
export class CustomerHealthController {
  constructor(private svc: CustomerHealthService) {}

  @Get()
  getSummary() {
    return this.svc.getSummary()
  }

  @Get('all')
  getAll() {
    return this.svc.getAllHealth()
  }

  @Get(':orgId')
  getOrg(@Param('orgId') orgId: string) {
    return this.svc.getOrgHealth(orgId)
  }
}
