import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { RealtimeGateway } from './websocket.gateway'

@Global()
@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET || 'dev', signOptions: { expiresIn: '15m' } }),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class GatewayModule {}
