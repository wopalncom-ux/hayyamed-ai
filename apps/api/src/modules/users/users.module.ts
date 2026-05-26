import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController, SettingsController } from './users.controller'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController, SettingsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
