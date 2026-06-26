import { Module } from '@nestjs/common'
import { MasterAdminController } from './master-admin.controller'
import { MasterAdminService } from './master-admin.service'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Module({
  imports: [DatabaseModule],
  controllers: [MasterAdminController],
  providers: [MasterAdminService, OwnerGuard],
})
export class MasterAdminModule {}
