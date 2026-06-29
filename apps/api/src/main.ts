// ============================================
// HAYYAMED AI — BACKEND ENTRY POINT
// apps/api/src/main.ts
// ============================================

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { ThrottlerExceptionFilter } from './common/filters/throttler.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  // Health check (outside global prefix — Cloud Run pings this)
  const httpAdapter = app.getHttpAdapter()
  httpAdapter.get('/health', (_req: any, res: any) => res.json({ status: 'ok', ts: Date.now() }))

  // Security headers (HSTS, noSniff, frameguard, referrer-policy, etc.).
  // CSP is disabled because this is a JSON API consumed cross-origin by the
  // embeddable widget and the Swagger UI; a restrictive CSP would break both.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))

  // Global prefix
  app.setGlobalPrefix('api/v1')

  // CORS — reflect request origin so the embeddable website-chat widget works on
  // any customer domain. Safe because the API authenticates via Bearer tokens
  // (in localStorage, not cookies), so cross-origin sites cannot reuse a session.
  app.enableCors({
    origin: true,
    credentials: true,
  })

  // Rate limit error format
  app.useGlobalFilters(new ThrottlerExceptionFilter())

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  // Swagger API Docs
  const config = new DocumentBuilder()
    .setTitle('Hayya AI API')
    .setDescription('AI Omnichannel CRM Platform — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`🚀 Hayya AI API running on port ${port}`)
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap()
