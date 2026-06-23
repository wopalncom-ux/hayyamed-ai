// ============================================
// HAYYAMED AI — BACKEND MAIN MODULE
// apps/api/src/app.module.ts
// ============================================

import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bull'
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
import { DatabaseModule } from './database/database.module'
import { RealtimeGateway } from './common/gateways/websocket.gateway'

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Queue
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: { host: config.get('REDIS_HOST'), port: config.get('REDIS_PORT') }
      })
    }),

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
  ],
  providers: [
    RealtimeGateway,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
