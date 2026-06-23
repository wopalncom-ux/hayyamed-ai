import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('campaigns')
export class CampaignsController {
  constructor(private campaigns: CampaignsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.campaigns.findAll(user.orgId, {
      status,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    })
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.campaigns.getStats(user.orgId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.findOne(id, user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.campaigns.create(user.orgId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.campaigns.update(id, user.orgId, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.remove(id, user.orgId)
  }
}
