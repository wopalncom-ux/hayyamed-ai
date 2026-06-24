import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { DatabaseModule } from '../../database/database.module'
import { EmailModule } from '../email/email.module'
import { AuditService } from '../audit/audit.service'

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    JwtModule.register({ secret: process.env.JWT_SECRET || 'dev', signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuditService],
  exports: [AuthService],
})
export class AuthModule {}
