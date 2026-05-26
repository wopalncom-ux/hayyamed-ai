import { Controller, Get, Patch, Post, Body, Headers, UnauthorizedException } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  private getOrgId(headers: Record<string, string>): string {
    const orgId = headers['x-org-id']
    if (!orgId) throw new UnauthorizedException('x-org-id header required')
    return orgId
  }

  private getUserId(headers: Record<string, string>): string {
    const userId = headers['x-user-id']
    if (!userId) throw new UnauthorizedException('x-user-id header required')
    return userId
  }

  @Get('me')
  getMe(@Headers() headers: Record<string, string>) {
    return this.users.getMe(this.getUserId(headers))
  }

  @Patch('me')
  updateMe(@Headers() headers: Record<string, string>, @Body() dto: any) {
    return this.users.updateMe(this.getUserId(headers), dto)
  }

  @Get('team')
  getTeam(@Headers() headers: Record<string, string>) {
    return this.users.getTeam(this.getOrgId(headers))
  }

  @Post('team/invite')
  invite(@Headers() headers: Record<string, string>, @Body() dto: any) {
    return this.users.inviteTeamMember(this.getOrgId(headers), dto)
  }
}

@Controller('settings')
export class SettingsController {
  constructor(private users: UsersService) {}

  private getOrgId(headers: Record<string, string>): string {
    const orgId = headers['x-org-id']
    if (!orgId) throw new UnauthorizedException('x-org-id header required')
    return orgId
  }

  @Get()
  get(@Headers() headers: Record<string, string>) {
    return this.users.getOrgSettings(this.getOrgId(headers))
  }

  @Patch()
  update(@Headers() headers: Record<string, string>, @Body() dto: any) {
    return this.users.updateOrgSettings(this.getOrgId(headers), dto)
  }
}
