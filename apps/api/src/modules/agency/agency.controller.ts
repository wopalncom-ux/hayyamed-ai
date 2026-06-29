import { Controller, Get, Post, Patch, Delete, Body, Param, ParseFloatPipe, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AgencyService } from './agency.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { OwnerGuard } from '../../common/guards/owner.guard'
import { extractText } from '../../common/util/extract-text.util'

// Agency / Client AI Operating Center — platform-owner only. Clients use /portal.
@UseGuards(OwnerGuard)
@Controller('agency')
export class AgencyController {
  constructor(private agency: AgencyService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  @Get('stats')
  stats(@CurrentUser() user: JwtPayload) {
    return this.agency.getStats(user.orgId)
  }

  // ── Owner control & logs (P8) ────────────────────────────────────────────
  @Get('overview')
  overview(@CurrentUser() user: JwtPayload) {
    return this.agency.ownerOverview(user.orgId)
  }

  @Get('audit-logs')
  auditLogs(@CurrentUser() user: JwtPayload) {
    return this.agency.ownerAuditLogs(user.orgId)
  }

  @Post('clients/:id/active')
  setActive(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.agency.setClientActive(user.orgId, id, !!body.isActive)
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

  // Create a client-portal login (role CLIENT, scoped to the client org).
  @Post('clients/:id/portal-user')
  createPortalUser(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { email: string; name?: string; password?: string }) {
    return this.agency.createClientPortalUser(user.orgId, id, body)
  }

  @Post('clients/:id/top-up')
  topUp(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { amount: number }) {
    return this.agency.topUp(user.orgId, id, Number(body.amount) || 0)
  }

  // ── Per-client Wallet / Billing / Profit ─────────────────────────────────
  @Get('clients/:id/billing')
  billing(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.clientBilling(user.orgId, id)
  }

  @Post('clients/:id/charge')
  charge(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { providerCost: number; description?: string }) {
    return this.agency.chargeClient(user.orgId, id, Number(body.providerCost) || 0, body.description || '')
  }

  @Post('clients/:id/low-balance')
  lowBalance(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { threshold: number }) {
    return this.agency.setLowBalanceThreshold(user.orgId, id, Number(body.threshold) || 0)
  }

  @Delete('clients/:id')
  deleteClient(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.deleteClient(user.orgId, id)
  }

  // ── Per-client AI Brain ──────────────────────────────────────────────────
  @Get('clients/:id/brains')
  listBrains(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.listClientBrains(user.orgId, id)
  }

  @Get('clients/:id/storage')
  storage(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.clientStorage(user.orgId, id)
  }

  @Post('clients/:id/brains')
  createBrain(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: { name: string; description?: string }) {
    return this.agency.createClientBrain(user.orgId, id, dto)
  }

  @Post('clients/:id/brains/:kbId/sources')
  addSource(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('kbId') kbId: string, @Body() dto: any) {
    return this.agency.addClientSource(user.orgId, id, kbId, dto)
  }

  @Delete('clients/:id/brains/:kbId/sources/:sourceId')
  removeSource(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('kbId') kbId: string, @Param('sourceId') sourceId: string) {
    return this.agency.removeClientSource(user.orgId, id, kbId, sourceId)
  }

  @Post('clients/:id/brains/:kbId/retrain')
  retrain(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('kbId') kbId: string) {
    return this.agency.retrainClientBrain(user.orgId, id, kbId)
  }

  // Upload a file (PDF/TXT/CSV/MD/JSON) → extract text → index into the client's brain.
  @Post('clients/:id/brains/:kbId/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  async uploadSource(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('kbId') kbId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded')
    let content = ''
    try { content = await extractText(file) } catch { throw new BadRequestException('Could not read this file. Supported: PDF, TXT, CSV, MD, JSON.') }
    if (!content.trim()) throw new BadRequestException('No readable text found in the file.')
    return this.agency.addClientSource(user.orgId, id, kbId, { type: 'file', name: file.originalname || 'Uploaded file', content: content.slice(0, 200000) })
  }

  // ── Per-client AI Agents ─────────────────────────────────────────────────
  @Get('clients/:id/agents')
  listAgents(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.listClientAgents(user.orgId, id)
  }

  @Post('clients/:id/agents')
  createAgent(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.agency.createClientAgent(user.orgId, id, dto)
  }

  @Patch('clients/:id/agents/:agentId')
  updateAgent(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('agentId') agentId: string, @Body() dto: any) {
    return this.agency.updateClientAgent(user.orgId, id, agentId, dto)
  }

  @Delete('clients/:id/agents/:agentId')
  removeAgent(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('agentId') agentId: string) {
    return this.agency.removeClientAgent(user.orgId, id, agentId)
  }

  @Post('clients/:id/agents/:agentId/toggle')
  toggleAgent(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('agentId') agentId: string, @Body() body: { isActive: boolean }) {
    return this.agency.toggleClientAgent(user.orgId, id, agentId, !!body.isActive)
  }

  @Post('clients/:id/agents/:agentId/test')
  testAgent(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('agentId') agentId: string, @Body() body: { message: string; history?: any[] }) {
    return this.agency.testClientAgent(user.orgId, id, agentId, body.message, body.history || [])
  }

  // ── Per-client Channels ──────────────────────────────────────────────────
  @Get('clients/:id/channels')
  listChannels(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.listClientChannels(user.orgId, id)
  }

  @Get('clients/:id/channels/unipile/status')
  unipileStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.clientUnipileStatus(user.orgId, id)
  }

  @Post('clients/:id/channels/unipile/connect')
  connectUnipile(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { pairingPhone?: string }) {
    return this.agency.connectClientUnipile(user.orgId, id, body?.pairingPhone)
  }

  @Post('clients/:id/channels/meta')
  connectMeta(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.agency.connectClientMeta(user.orgId, id, dto)
  }

  @Post('clients/:id/channels/manual')
  connectManual(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.agency.connectClientManual(user.orgId, id, dto)
  }

  @Post('clients/:id/channels/instagram')
  connectInstagram(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.agency.connectClientInstagram(user.orgId, id, dto)
  }

  @Delete('clients/:id/channels/:channelId')
  disconnectChannel(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('channelId') channelId: string) {
    return this.agency.disconnectClientChannel(user.orgId, id, channelId)
  }

  // ── Per-client Modules (internal marketplace) ────────────────────────────
  @Get('module-catalog')
  moduleCatalog() {
    return this.agency.moduleCatalog()
  }

  @Get('clients/:id/modules')
  getModules(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.getClientModules(user.orgId, id)
  }

  @Post('clients/:id/modules/:moduleKey')
  setModule(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('moduleKey') moduleKey: string, @Body() body: { enabled: boolean }) {
    return this.agency.setClientModule(user.orgId, id, moduleKey, !!body.enabled)
  }

  // ── Per-client Automations ───────────────────────────────────────────────
  @Get('automation-templates')
  automationTemplates() {
    return this.agency.automationTemplates()
  }

  @Get('clients/:id/automations')
  listAutomations(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.listClientAutomations(user.orgId, id)
  }

  @Get('clients/:id/automation-runs')
  automationRuns(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.agency.clientAutomationRuns(user.orgId, id)
  }

  @Post('clients/:id/automations')
  createAutomation(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.agency.createClientAutomation(user.orgId, id, dto)
  }

  @Post('clients/:id/automations/install')
  installTemplate(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { templateId: string }) {
    return this.agency.installClientTemplate(user.orgId, id, body.templateId)
  }

  @Post('clients/:id/automations/:wfId/toggle')
  toggleAutomation(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('wfId') wfId: string, @Body() body: { isActive: boolean }) {
    return this.agency.toggleClientAutomation(user.orgId, id, wfId, !!body.isActive)
  }

  @Delete('clients/:id/automations/:wfId')
  removeAutomation(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('wfId') wfId: string) {
    return this.agency.removeClientAutomation(user.orgId, id, wfId)
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
