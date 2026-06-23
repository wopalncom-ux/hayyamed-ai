import { Module } from '@nestjs/common'
import { KnowledgeBaseController } from './knowledge-base.controller'
import { KnowledgeBaseService } from './knowledge-base.service'
import { RagService } from './rag.service'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, RagService],
  exports: [KnowledgeBaseService, RagService],
})
export class KnowledgeBaseModule {}
