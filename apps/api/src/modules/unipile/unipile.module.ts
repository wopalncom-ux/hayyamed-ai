import { Module } from '@nestjs/common'
import { UnipileController } from './unipile.controller'
import { UnipileService } from './unipile.service'
import { DatabaseModule } from '../../database/database.module'
import { AIModule } from '../ai/ai.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'
import { WorkflowsModule } from '../workflows/workflows.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [DatabaseModule, AIModule, KnowledgeBaseModule, WorkflowsModule, NotificationsModule],
  controllers: [UnipileController],
  providers: [UnipileService],
  exports: [UnipileService],
})
export class UnipileModule {}
