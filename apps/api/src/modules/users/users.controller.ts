import { Controller, Get, Patch, Post, Body } from '@nestjs/common'
import { UsersService } from './users.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.users.getMe(user.sub)
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.users.updateMe(user.sub, dto)
  }

  @Get('team')
  getTeam(@CurrentUser() user: JwtPayload) {
    return this.users.getTeam(user.orgId)
  }

  @Post('team/invite')
  invite(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.users.inviteTeamMember(user.orgId, dto)
  }
}

@Controller('settings')
export class SettingsController {
  constructor(private users: UsersService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.users.getOrgSettings(user.orgId)
  }

  @Patch()
  update(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.users.updateOrgSettings(user.orgId, dto)
  }
}
