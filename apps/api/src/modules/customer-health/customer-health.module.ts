import { Module } from '@nestjs/common'
import { CustomerHealthService } from './customer-health.service'
import { CustomerHealthController } from './customer-health.controller'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerHealthController],
  providers: [CustomerHealthService],
  exports: [CustomerHealthService],
})
export class CustomerHealthModule {}
