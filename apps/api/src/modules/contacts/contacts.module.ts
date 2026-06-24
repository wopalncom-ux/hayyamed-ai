import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { ContactsService } from './contacts.service'
import { ContactsImportService } from './contacts-import.service'
import { ContactsController } from './contacts.controller'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({ dest: '/tmp' }),
  ],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsImportService],
  exports: [ContactsService],
})
export class ContactsModule {}
