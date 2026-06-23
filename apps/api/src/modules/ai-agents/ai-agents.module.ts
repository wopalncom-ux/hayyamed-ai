import { Module } from '@nestjs/common'
import { AIAgentsController } from './ai-agents.controller'
import { AIAgentsService } from './ai-agents.service'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [AIAgentsController],
  providers: [AIAgentsService],
  exports: [AIAgentsService],
})
export class AIAgentsModule {}
