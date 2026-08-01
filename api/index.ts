import 'reflect-metadata'
import { NestFactory, Reflector } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import express, { Request, Response } from 'express'
import { AppModule } from '../src/app.module'
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter'

// Vercel reutilise l'instance entre invocations "chaudes": on n'initialise
// l'application Nest qu'une seule fois pour eviter de reconnecter la base
// de donnees et de recharger tous les modules a chaque requete.
const server = express()
let isBootstrapped = false

async function bootstrap() {
  if (isBootstrapped) return

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server))

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.useGlobalFilters(new HttpExceptionFilter())
  app.setGlobalPrefix('api')

  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription("API REST du projet TaskFlow - Gestion de taches. Examen Final API REST, L2 GI.")
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.init()
  isBootstrapped = true
}

export default async function handler(req: Request, res: Response) {
  await bootstrap()
  server(req, res)
}
