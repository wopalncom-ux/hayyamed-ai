import { Module, forwardRef } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ContactsService } from './contacts.service'
import { ContactsImportService } from './contacts-import.service'
import { ContactsController } from './contacts.controller'
import { DatabaseModule } from '../../database/database.module'
import { WorkflowsModule } from '../workflows/workflows.module'

@Module({
  imports: [
    DatabaseModule,
    // memoryStorage populates file.buffer (the importer reads file.buffer, not file.path);
    // `dest:'/tmp'` previously forced disk storage → file.buffer undefined → 0 rows parsed.
    MulterModule.register({ storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }),
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsImportService],
  exports: [ContactsService],
})
export class ContactsModule {}
