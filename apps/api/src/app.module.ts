// ============================================
// HAYYAMED AI — BACKEND MAIN MODULE
// apps/api/src/app.module.ts
// ============================================

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bull'

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
import { DatabaseModule } from './database/database.module'
import { WebSocketGateway } from './common/gateways/websocket.gateway'

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
  ],
  providers: [WebSocketGateway],
})
export class AppModule {}
