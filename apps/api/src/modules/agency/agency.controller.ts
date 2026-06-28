import { Controller, Get, Post, Patch, Delete, Body, Param, ParseFloatPipe } from '@nestjs/common'
import { AgencyService } from './agency.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('agency')
export class AgencyController {
  constructor(private agency: AgencyService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  @Get('stats')
  stats(@CurrentUser() user: JwtPayload) {
    return this.agency.getStats(user.orgId)
  }

  // ── Clients ────────────────────────────────────────────────────────────────

  @Get('clients')
  listClients(@CurrentUser() user: JwtPayload) {
    return this.agency.listClients(user.orgId)
  }

  @Get('clients/:id')
  getClient(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.getClientDetail(user.orgId, id)
  }

  @Post('clients')
  createClient(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.agency.createClient(user.orgId, dto)
  }

  @Patch('clients/:id')
  updateClient(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.agency.updateClient(user.orgId, id, dto)
  }

  @Post('clients/:id/top-up')
  topUp(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { amount: number }) {
    return this.agency.topUp(user.orgId, id, Number(body.amount) || 0)
  }

  @Delete('clients/:id')
  deleteClient(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.deleteClient(user.orgId, id)
  }

  // ── Packages ───────────────────────────────────────────────────────────────

  @Get('packages')
  listPackages(@CurrentUser() user: JwtPayload) {
    return this.agency.listPackages(user.orgId)
  }

  @Post('packages')
  createPackage(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.agency.createPackage(user.orgId, dto)
  }

  @Patch('packages/:id')
  updatePackage(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.agency.updatePackage(user.orgId, id, dto)
  }

  @Delete('packages/:id')
  deletePackage(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.deletePackage(user.orgId, id)
  }
}
