import { Module } from '@nestjs/common'
import { TelegramController } from './telegram.controller'
import { TelegramService } from './telegram.service'
import { DatabaseModule } from '../../database/database.module'
import { AIModule } from '../ai/ai.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [DatabaseModule, AIModule, KnowledgeBaseModule, NotificationsModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
