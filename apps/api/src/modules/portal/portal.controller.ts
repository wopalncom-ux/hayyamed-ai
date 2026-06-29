import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { PortalService } from './portal.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

// Client-portal self-service API. Scoped to the caller's own org (their JWT),
// so a client only ever sees/manages their own team.
@Controller('portal')
export class PortalController {
  constructor(private portal: PortalService) {}

  @Get('me')
  me(@CurrentUser() u: JwtPayload) { return this.portal.me(u.sub) }

  @Get('team/catalog')
  catalog() { return this.portal.catalog() }

  @Get('team')
  team(@CurrentUser() u: JwtPayload) { return this.portal.listTeam(u.orgId) }

  @Post('team')
  invite(@CurrentUser() u: JwtPayload, @Body() dto: any) { return this.portal.invite(u.sub, u.orgId, dto) }

  @Patch('team/:id')
  update(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: any) { return this.portal.update(u.sub, u.orgId, id, dto) }

  @Delete('team/:id')
  remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.portal.remove(u.sub, u.orgId, id) }
}
