import { Module, Global } from '@nestjs/common'
import { AIObservabilityService } from './ai-observability.service'
import { AIObservabilityController, AdminAIObservabilityController } from './ai-observability.controller'
import { DatabaseModule } from '../../database/database.module'

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AIObservabilityController, AdminAIObservabilityController],
  providers: [AIObservabilityService],
  exports: [AIObservabilityService],
})
export class AIObservabilityModule {}
