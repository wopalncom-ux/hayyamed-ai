import { Module } from '@nestjs/common'
import { AgencyController } from './agency.controller'
import { AgencyService } from './agency.service'
import { DatabaseModule } from '../../database/database.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'
import { AIAgentsModule } from '../ai-agents/ai-agents.module'

@Module({
  imports: [DatabaseModule, KnowledgeBaseModule, AIAgentsModule],
  controllers: [AgencyController],
  providers: [AgencyService],
})
export class AgencyModule {}
