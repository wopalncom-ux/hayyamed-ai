import { Module, Global } from '@nestjs/common'
import { FeatureFlagsService } from './feature-flags.service'
import { FeatureFlagsController, AdminFeatureFlagsController } from './feature-flags.controller'
import { DatabaseModule } from '../../database/database.module'

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [FeatureFlagsController, AdminFeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
