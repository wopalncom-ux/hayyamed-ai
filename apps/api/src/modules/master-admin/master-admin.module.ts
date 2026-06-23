import { Module } from '@nestjs/common'
import { MasterAdminController } from './master-admin.controller'
import { MasterAdminService } from './master-admin.service'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [MasterAdminController],
  providers: [MasterAdminService],
})
export class MasterAdminModule {}
