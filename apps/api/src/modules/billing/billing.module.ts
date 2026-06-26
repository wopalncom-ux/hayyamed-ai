import { Module } from '@nestjs/common'
import { BillingService } from './billing.service'
import { BillingController } from './billing.controller'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController],
  providers: [BillingService, OwnerGuard],
  exports: [BillingService],
})
export class BillingModule {}
