import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import multer from 'multer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  // app.use(multer().any());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FE_URL,
    credentials: true,
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
