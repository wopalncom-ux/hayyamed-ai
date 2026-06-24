import { Module, Global } from '@nestjs/common'
import { AuditService } from './audit.service'
import { AuditController, AdminAuditController } from './audit.controller'
import { DatabaseModule } from '../../database/database.module'

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuditController, AdminAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
