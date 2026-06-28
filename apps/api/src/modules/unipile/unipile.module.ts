import { Module } from '@nestjs/common'
import { UnipileController } from './unipile.controller'
import { UnipileService } from './unipile.service'
import { DatabaseModule } from '../../database/database.module'
import { AIModule } from '../ai/ai.module'
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module'

@Module({
  imports: [DatabaseModule, AIModule, KnowledgeBaseModule],
  controllers: [UnipileController],
  providers: [UnipileService],
  exports: [UnipileService],
})
export class UnipileModule {}
