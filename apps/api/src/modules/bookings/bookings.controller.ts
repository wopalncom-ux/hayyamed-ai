import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { BookingsService } from './bookings.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('bookings')
export class BookingsController {
  constructor(private svc: BookingsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
    @Query('contactId') contactId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll(user.orgId, {
      status, staffId, contactId,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.findOne(id, user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.svc.create(user.orgId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.svc.update(id, user.orgId, dto)
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.cancel(id, user.orgId)
  }
}
