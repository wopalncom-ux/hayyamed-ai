// ============================================
// HAYYAMED AI — BACKEND ENTRY POINT
// apps/api/src/main.ts
// ============================================

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  // Global prefix
  app.setGlobalPrefix('api/v1')

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

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
    .setTitle('Hayyamed AI API')
    .setDescription('AI Omnichannel CRM Platform — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`🚀 Hayyamed AI API running on port ${port}`)
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap()
