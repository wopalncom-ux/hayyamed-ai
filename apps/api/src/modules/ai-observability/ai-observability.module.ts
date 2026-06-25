import { Module, Global } from '@nestjs/common'
import { AIObservabilityService } from './ai-observability.service'
import { AIObservabilityController, AdminAIObservabilityController } from './ai-observability.controller'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AIObservabilityController, AdminAIObservabilityController],
  providers: [AIObservabilityService, OwnerGuard],
  exports: [AIObservabilityService],
})
export class AIObservabilityModule {}
