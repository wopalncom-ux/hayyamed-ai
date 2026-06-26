import { Module } from '@nestjs/common'
import { WebchatController } from './webchat.controller'
import { WebchatService } from './webchat.service'
import { DatabaseModule } from '../../database/database.module'
import { AIModule } from '../ai/ai.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'

@Module({
  imports: [DatabaseModule, AIModule, KnowledgeBaseModule],
  controllers: [WebchatController],
  providers: [WebchatService],
  exports: [WebchatService],
})
export class WebchatModule {}
