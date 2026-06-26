import { Module } from '@nestjs/common'
import { MyFatoorahService } from './myfatoorah.service'
import { MyFatoorahController } from './myfatoorah.controller'
import { DatabaseModule } from '../../database/database.module'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Module({
  imports: [DatabaseModule],
  controllers: [MyFatoorahController],
  providers: [MyFatoorahService, OwnerGuard],
})
export class MyFatoorahModule {}
