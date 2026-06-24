import { Module } from '@nestjs/common'
import { WorkflowsController } from './workflows.controller'
import { WorkflowsService } from './workflows.service'
import { WorkflowEngineService } from './workflow-engine.service'
import { DatabaseModule } from '../../database/database.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'

@Module({
  imports: [DatabaseModule, WhatsAppModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowEngineService],
  exports: [WorkflowsService, WorkflowEngineService],
})
export class WorkflowsModule {}
