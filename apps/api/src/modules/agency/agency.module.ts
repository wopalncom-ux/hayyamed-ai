import { Module } from '@nestjs/common'
import { AgencyController } from './agency.controller'
import { AgencyService } from './agency.service'
import { DatabaseModule } from '../../database/database.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'
import { AIAgentsModule } from '../ai-agents/ai-agents.module'
import { UnipileModule } from '../unipile/unipile.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'
import { InstagramModule } from '../instagram/instagram.module'
import { WorkflowsModule } from '../workflows/workflows.module'

@Module({
  imports: [DatabaseModule, KnowledgeBaseModule, AIAgentsModule, UnipileModule, WhatsAppModule, InstagramModule, WorkflowsModule],
  controllers: [AgencyController],
  providers: [AgencyService],
})
export class AgencyModule {}
