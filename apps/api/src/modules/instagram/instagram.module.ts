import { Module } from '@nestjs/common'
import { InstagramController } from './instagram.controller'
import { InstagramService } from './instagram.service'
import { DatabaseModule } from '../../database/database.module'
import { AIModule } from '../ai/ai.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [DatabaseModule, AIModule, KnowledgeBaseModule, NotificationsModule],
  controllers: [InstagramController],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
