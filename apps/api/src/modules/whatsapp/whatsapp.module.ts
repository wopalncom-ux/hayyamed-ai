import { Module } from '@nestjs/common'
import { WhatsAppService } from './whatsapp.service'
import { WhatsAppController } from './whatsapp.controller'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
