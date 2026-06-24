import { Module } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { CampaignsController } from './campaigns.controller'
import { DatabaseModule } from '../../database/database.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'

@Module({
  imports: [DatabaseModule, WhatsAppModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
