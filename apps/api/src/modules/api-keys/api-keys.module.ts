import { Module } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'
import { ApiKeyGuard } from './api-key.guard'
import { ApiKeysController, PublicApiController } from './api-keys.controller'
import { DatabaseModule } from '../../database/database.module'
import { ContactsModule } from '../contacts/contacts.module'

@Module({
  imports: [DatabaseModule, ContactsModule],
  controllers: [ApiKeysController, PublicApiController],
  providers: [ApiKeysService, ApiKeyGuard],
})
export class ApiKeysModule {}
