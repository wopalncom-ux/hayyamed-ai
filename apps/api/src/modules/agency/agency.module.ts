import { Module } from '@nestjs/common'
import { AgencyController } from './agency.controller'
import { AgencyService } from './agency.service'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [AgencyController],
  providers: [AgencyService],
})
export class AgencyModule {}
