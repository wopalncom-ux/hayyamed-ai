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
    const { email, password } = body || {}
    if (!email || !password) {
      throw new BadRequestException('email and password are required')
    }
    return this.auth.login(email, password)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() body: { userId: string }) {
    const { userId } = body || {}
    if (!userId) {
      throw new BadRequestException('userId is required')
    }
    return this.auth.logout(userId)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(REFRESH_LIMIT)
  refresh(@Body() body: { userId: string; refreshToken: string }) {
    const { userId, refreshToken } = body || {}
    if (!userId || !refreshToken) {
      throw new BadRequestException('userId and refreshToken are required')
    }
    return this.auth.refreshTokens(userId, refreshToken)
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(FORGOT_LIMIT)
  forgotPassword(@Body() body: { email: string }) {
    const { email } = body || {}
    if (!email) {
      throw new BadRequestException('email is required')
    }
    return this.auth.forgotPassword(email)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_LIMIT)
  resetPassword(@Body() body: { token: string; password: string }) {
    const { token, password } = body || {}
    if (!token || !password) {
      throw new BadRequestException('token and password are required')
    }
    return this.auth.resetPassword(token, password)
  }
}
