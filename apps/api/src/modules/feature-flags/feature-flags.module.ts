import { Module, Global } from '@nestjs/common'
import { FeatureFlagsService } from './feature-flags.service'
import { FeatureFlagsController, AdminFeatureFlagsController } from './feature-flags.controller'
import { PrismaModule } from '../../database/prisma.module'

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [FeatureFlagsController, AdminFeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
