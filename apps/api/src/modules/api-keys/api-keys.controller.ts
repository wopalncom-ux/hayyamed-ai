import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'
import { ApiKeyGuard } from './api-key.guard'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { Public } from '../../common/decorators/public.decorator'
import { ContactsService } from '../contacts/contacts.service'

// ── Management (JWT-authed) ────────────────────────────────────────────────
@Controller('api-keys')
export class ApiKeysController {
  constructor(private svc: ApiKeysService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.svc.list(user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: { name?: string }) {
    return this.svc.create(user.orgId, (body || {}).name)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.remove(user.orgId, id)
  }
}

// ── Public inbound API (API-key auth) ──────────────────────────────────────
@Public()
@UseGuards(ApiKeyGuard)
@Controller('public')
export class PublicApiController {
  constructor(private contacts: ContactsService) {}

  // Create a lead/contact from an external source (website form, ad, etc.).
  @Post('leads')
  createLead(@Req() req: any, @Body() body: { name?: string; phone?: string; email?: string; source?: string; notes?: string }) {
    return this.contacts.create(req.apiOrgId, {
      name: body?.name || '',
      phone: body?.phone || '',
      email: body?.email || '',
      source: body?.source || 'api',
      notes: body?.notes || '',
      status: 'NEW',
    })
  }
}
