import { Module } from '@nestjs/common'
import { MarketplaceService } from './marketplace.service'
import { MarketplaceController, AdminMarketplaceController } from './marketplace.controller'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [MarketplaceController, AdminMarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
