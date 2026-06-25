import { Module } from '@nestjs/common'
import { AIQualityService } from './ai-quality.service'
import { AIQualityController, AdminAIQualityController } from './ai-quality.controller'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Module({
  imports: [DatabaseModule],
  controllers: [AIQualityController, AdminAIQualityController],
  providers: [AIQualityService, OwnerGuard],
  exports: [AIQualityService],
})
export class AIQualityModule {}
