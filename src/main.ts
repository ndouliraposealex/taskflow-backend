import 'reflect-metadata'
import { setDefaultResultOrder } from 'dns'
import { NestFactory, Reflector } from '@nestjs/core'
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

// Sur certaines machines Windows, la résolution DNS privilégie l'IPv6 alors
// que la route IPv6 locale est cassée -> Node timeout (ETIMEDOUT) sur des
// appels sortants (ex: OpenWeather) alors que curl/le navigateur, qui
// retombent plus vite sur l'IPv4, fonctionnent. On force donc l'IPv4 en priorité.
setDefaultResultOrder('ipv4first')

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Applique @Exclude() (ex: User.password) a toutes les reponses JSON
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // supprime les champs non declares dans les DTO
      forbidNonWhitelisted: true,
      transform: true,          // convertit automatiquement les payloads vers les types des DTO
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

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`TaskFlow API running on http://localhost:${port}/api`)
  console.log(`Swagger docs on http://localhost:${port}/api/docs`)
}
bootstrap()
