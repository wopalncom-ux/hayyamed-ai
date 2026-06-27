import { Module } from '@nestjs/common'
import { WebchatController } from './webchat.controller'
import { WebchatService } from './webchat.service'
import { DatabaseModule } from '../../database/database.module'
import { AIModule } from '../ai/ai.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { WorkflowsModule } from '../workflows/workflows.module'

@Module({
  imports: [DatabaseModule, AIModule, KnowledgeBaseModule, NotificationsModule, WorkflowsModule],
  controllers: [WebchatController],
  providers: [WebchatService],
  exports: [WebchatService],
})
export class WebchatModule {}
