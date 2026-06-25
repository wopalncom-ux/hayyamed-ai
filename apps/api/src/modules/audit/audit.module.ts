import { Module, Global } from '@nestjs/common'
import { AuditService } from './audit.service'
import { AuditController, AdminAuditController } from './audit.controller'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuditController, AdminAuditController],
  providers: [AuditService, OwnerGuard],
  exports: [AuditService],
})
export class AuditModule {}
