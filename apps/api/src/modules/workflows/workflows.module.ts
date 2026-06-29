import { Module } from '@nestjs/common'
import { WorkflowsController } from './workflows.controller'
import { WorkflowsService } from './workflows.service'
import { WorkflowEngineService } from './workflow-engine.service'
import { DatabaseModule } from '../../database/database.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'
import { AIModule } from '../ai/ai.module'

@Module({
  imports: [DatabaseModule, WhatsAppModule, AIModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowEngineService],
  exports: [WorkflowsService, WorkflowEngineService],
})
export class WorkflowsModule {}
