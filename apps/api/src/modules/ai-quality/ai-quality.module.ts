import { Module } from '@nestjs/common'
import { AIQualityService } from './ai-quality.service'
import { AIQualityController, AdminAIQualityController } from './ai-quality.controller'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [AIQualityController, AdminAIQualityController],
  providers: [AIQualityService],
  exports: [AIQualityService],
})
export class AIQualityModule {}
