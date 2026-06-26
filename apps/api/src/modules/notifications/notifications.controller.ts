import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get('vapid-key')
  vapidKey() {
    return this.svc.getVapidPublicKey()
  }

  @Post('subscribe')
  subscribe(@CurrentUser() user: JwtPayload, @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.svc.saveSubscription(user.sub, user.orgId, body)
  }

  @Post('test-push')
  async testPush(@CurrentUser() user: JwtPayload) {
    await this.svc.sendPush(user.sub, { title: '🔔 Hayyamed AI', body: 'Push notifications are working!', url: '/dashboard' })
    return { sent: true }
  }

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
