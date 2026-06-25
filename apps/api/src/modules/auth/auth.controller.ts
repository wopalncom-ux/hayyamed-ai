import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { Public } from '../../common/decorators/public.decorator'

// Auth endpoints get much stricter limits than the global 100/60s default.
// login/register: 10 attempts per minute (brute-force protection)
// forgot-password: 3 per minute (prevents email flooding)
// refresh: 30 per minute (mobile apps call this frequently)
const AUTH_LIMIT   = { default: { limit: 10,  ttl: 60000 } }
const FORGOT_LIMIT = { default: { limit: 3,   ttl: 60000 } }
const REFRESH_LIMIT = { default: { limit: 30, ttl: 60000 } }

@Public()
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle(AUTH_LIMIT)
  register(@Body() body: any) {
    const { name, email, password, orgName, phone, industry, country, language } = body || {}
    if (!name || !email || !password || !orgName) {
      throw new BadRequestException('name, email, password, and orgName are required')
    }
    return this.auth.register({ name, email, password, orgName, phone, industry, country, language })
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_LIMIT)
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
  @Throttle(REFRESH_LIMIT)
  refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.auth.refreshTokens(body.userId, body.refreshToken)
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(FORGOT_LIMIT)
  forgotPassword(@Body() body: { email: string }) {
    return this.auth.forgotPassword(body.email)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_LIMIT)
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.auth.resetPassword(body.token, body.password)
  }
}
