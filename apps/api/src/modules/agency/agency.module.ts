import { Module } from '@nestjs/common'
import { AgencyController } from './agency.controller'
import { AgencyService } from './agency.service'
import { DatabaseModule } from '../../database/database.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'

@Module({
  imports: [DatabaseModule, KnowledgeBaseModule],
  controllers: [AgencyController],
  providers: [AgencyService],
})
export class AgencyModule {}
