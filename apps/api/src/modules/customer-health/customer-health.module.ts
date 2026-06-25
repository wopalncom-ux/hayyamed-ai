import { Module } from '@nestjs/common'
import { CustomerHealthService } from './customer-health.service'
import { CustomerHealthController } from './customer-health.controller'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerHealthController],
  providers: [CustomerHealthService, OwnerGuard],
  exports: [CustomerHealthService],
})
export class CustomerHealthModule {}
