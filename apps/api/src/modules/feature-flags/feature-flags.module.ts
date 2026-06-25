import { Module, Global } from '@nestjs/common'
import { FeatureFlagsService } from './feature-flags.service'
import { FeatureFlagsController, AdminFeatureFlagsController } from './feature-flags.controller'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [FeatureFlagsController, AdminFeatureFlagsController],
  providers: [FeatureFlagsService, OwnerGuard],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
