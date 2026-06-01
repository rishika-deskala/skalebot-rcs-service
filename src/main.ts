import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppLogger } from './logger/logger.module';
import { NewRelicAttributesInterceptor } from './middleware/newrelic-attributes.interceptor';
import { RequestLoggingInterceptor } from './middleware/request-logging.interceptor';
import { AllExceptionsFilter } from './shared/filters/http-exception.filter';

require('dotenv').config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable trust proxy to get real client IPs when behind reverse proxy/load balancer
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  // Register global exception filter with logger injection
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  
  // Register global interceptors
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(logger),
    new NewRelicAttributesInterceptor()
  );
  // Swagger setup
  const globalPrefix = process.env.APP_NAME || 'wca-webhook';
  const swaggerPath = 'skalebot-api-docs';
  let server = "/";
  if (process.env.DEBUG != 'true') {
    server = "/" + globalPrefix;
  }

  const config = new DocumentBuilder()
    .setTitle('Skalebot WCA Service')
    .setDescription('Skalebot WCA API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'apiKey',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .addServer(server, 'Default server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);

  if (process.env.DEBUG == 'true') {
    const { default: open } = await import('open');
    const url = `http://localhost:${process.env.PORT}/${swaggerPath}`;
    await open(url);
  }
}

bootstrap();
