// ============================================
// HAYYAMED AI — BACKEND MAIN MODULE
// apps/api/src/app.module.ts
// ============================================

import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { JwtAuthGuard } from './common/guards/jwt.guard'

import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { ConversationsModule } from './modules/conversations/conversations.module'
import { ContactsModule } from './modules/contacts/contacts.module'
import { CampaignsModule } from './modules/campaigns/campaigns.module'
import { ReportsModule } from './modules/reports/reports.module'
import { ChatbotModule } from './modules/chatbot/chatbot.module'
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module'
import { AIModule } from './modules/ai/ai.module'
import { BillingModule } from './modules/billing/billing.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { AIAgentsModule } from './modules/ai-agents/ai-agents.module'
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module'
import { BookingsModule } from './modules/bookings/bookings.module'
import { MasterAdminModule } from './modules/master-admin/master-admin.module'
import { WorkflowsModule } from './modules/workflows/workflows.module'
import { AgencyModule } from './modules/agency/agency.module'
import { IntegrationsModule } from './modules/integrations/integrations.module'
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module'
import { AIObservabilityModule } from './modules/ai-observability/ai-observability.module'
import { CustomerHealthModule } from './modules/customer-health/customer-health.module'
import { AIQualityModule } from './modules/ai-quality/ai-quality.module'
import { AuditModule } from './modules/audit/audit.module'
import { MarketplaceModule } from './modules/marketplace/marketplace.module'
import { EmailModule } from './modules/email/email.module'
import { WebchatModule } from './modules/webchat/webchat.module'
import { TelegramModule } from './modules/telegram/telegram.module'
import { DatabaseModule } from './database/database.module'
import { GatewayModule } from './common/gateways/gateway.module'

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Rate limiting (in-memory, single-instance; swap to Upstash at scale)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Real-time WebSocket (global — injected into services that need to emit events)
    GatewayModule,

    // Core
    DatabaseModule,
    JwtModule.register({ secret: process.env.JWT_SECRET || 'dev', signOptions: { expiresIn: '15m' } }),
    AuthModule,
    UsersModule,
    ConversationsModule,
    ContactsModule,
    CampaignsModule,
    ReportsModule,
    ChatbotModule,
    WhatsAppModule,
    AIModule,
    BillingModule,
    NotificationsModule,
    AIAgentsModule,
    KnowledgeBaseModule,
    BookingsModule,
    MasterAdminModule,
    WorkflowsModule,
    AgencyModule,
    IntegrationsModule,
    FeatureFlagsModule,
    AIObservabilityModule,
    CustomerHealthModule,
    AIQualityModule,
    AuditModule,
    MarketplaceModule,
    EmailModule,
    WebchatModule,
    TelegramModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
