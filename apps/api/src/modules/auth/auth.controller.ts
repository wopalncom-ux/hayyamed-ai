import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: any) {
    return this.auth.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() body: { userId: string }) {
    return this.auth.logout(body.userId)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.auth.refreshTokens(body.userId, body.refreshToken)
  }
}
