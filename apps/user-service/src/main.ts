import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { ValidationPipe } from '@nestjs/common';
import {
  GrpcOptions,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const config = app.get(ConfigService);

  await app.listen(config.get('PORT', 3000));
}
bootstrap();
