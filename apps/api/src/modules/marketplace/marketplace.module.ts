import { Module } from '@nestjs/common'
import { MarketplaceService } from './marketplace.service'
import { MarketplaceController, AdminMarketplaceController } from './marketplace.controller'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Module({
  imports: [DatabaseModule],
  controllers: [MarketplaceController, AdminMarketplaceController],
  providers: [MarketplaceService, OwnerGuard],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
