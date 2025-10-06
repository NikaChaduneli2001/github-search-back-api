import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './core/configs/swagger.config';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  setupSwagger(app, {
    title: 'Github Search API',
    description: `API documentation`,
    version: '1.0.0',
    path: '/api-docs',
    ignoreGlobalPrefix: false,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
