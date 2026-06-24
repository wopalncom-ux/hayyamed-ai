import { Controller, Get, Post, Delete, Patch, Param, Query, Body } from '@nestjs/common'
import { MarketplaceService } from './marketplace.service'
import { CurrentUser } from '../../common/decorators/user.decorator'

@Controller('marketplace')
export class MarketplaceController {
  constructor(private svc: MarketplaceService) {}

  @Get()
  list(
    @Query('category') category?: string,
    @Query('industry') industry?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    return this.svc.list({ category, industry, search, featured: featured === 'true' })
  }

  @Get('installed')
  getInstalled(@CurrentUser() user: any) {
    return this.svc.getInstalled(user.orgId)
  }

  @Get(':id')
  getItem(@Param('id') id: string) {
    return this.svc.getItem(id)
  }

  @Post(':id/install')
  install(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.install(user.orgId, id)
  }

  @Delete(':id/install')
  uninstall(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.uninstall(user.orgId, id)
  }

  @Post(':id/rate')
  rate(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { rating: number }) {
    return this.svc.rate(user.orgId, id, body.rating)
  }
}

@Controller('master-admin/marketplace')
export class AdminMarketplaceController {
  constructor(private svc: MarketplaceService) {}

  @Get('stats')
  getStats() {
    return this.svc.getStats()
  }

  @Get()
  listAll() {
    return this.svc.list({})
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { isPublished?: boolean; isFeatured?: boolean; price?: number }) {
    return this.svc.adminUpdate(id, body)
  }
}
