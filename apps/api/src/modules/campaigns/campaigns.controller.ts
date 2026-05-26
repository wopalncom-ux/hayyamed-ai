import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers, UnauthorizedException } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'

@Controller('campaigns')
export class CampaignsController {
  constructor(private campaigns: CampaignsService) {}

  private getOrgId(headers: Record<string, string>): string {
    const orgId = headers['x-org-id']
    if (!orgId) throw new UnauthorizedException('x-org-id header required')
    return orgId
  }

  @Get()
  findAll(
    @Headers() headers: Record<string, string>,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = this.getOrgId(headers)
    return this.campaigns.findAll(orgId, {
      status,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    })
  }

  @Get('stats')
  getStats(@Headers() headers: Record<string, string>) {
    const orgId = this.getOrgId(headers)
    return this.campaigns.getStats(orgId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers() headers: Record<string, string>) {
    const orgId = this.getOrgId(headers)
    return this.campaigns.findOne(id, orgId)
  }

  @Post()
  create(@Headers() headers: Record<string, string>, @Body() dto: any) {
    const orgId = this.getOrgId(headers)
    return this.campaigns.create(orgId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Headers() headers: Record<string, string>, @Body() dto: any) {
    const orgId = this.getOrgId(headers)
    return this.campaigns.update(id, orgId, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaigns.remove(id)
  }
}
