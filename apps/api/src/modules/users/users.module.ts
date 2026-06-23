import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController, SettingsController } from './users.controller'
import { DatabaseModule } from '../../database/database.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [UsersController, SettingsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
