import { Controller, Get, Patch, Delete, Param, Query } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  getAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.svc.getForUser(user.sub, +page, +limit)
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.svc.markAllRead(user.sub)
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.markRead(id, user.sub)
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.deleteOne(id, user.sub)
  }
}
