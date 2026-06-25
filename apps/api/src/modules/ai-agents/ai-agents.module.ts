import { Module } from '@nestjs/common'
import { AIAgentsController } from './ai-agents.controller'
import { AIAgentsService } from './ai-agents.service'
import { DatabaseModule } from '../../database/database.module'
import { AIModule } from '../ai/ai.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'

@Module({
  imports: [DatabaseModule, AIModule, KnowledgeBaseModule],
  controllers: [AIAgentsController],
  providers: [AIAgentsService],
  exports: [AIAgentsService],
})
export class AIAgentsModule {}
