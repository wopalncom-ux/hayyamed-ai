import { Module } from '@nestjs/common'
import { ConversationsService } from './conversations.service'
import { ConversationsController } from './conversations.controller'
import { DatabaseModule } from '../../database/database.module'
import { AIModule } from '../ai/ai.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [DatabaseModule, AIModule, NotificationsModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
