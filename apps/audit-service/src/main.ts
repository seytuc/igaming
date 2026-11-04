import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  AUDIT_GRPC_PORT,
  AUDIT_PROTO_PATH,
  AUDIT_V1_PACKAGE_NAME,
} from '@app/contracts';

const DEFAULT_AUDIT_GRPC_BIND_URL = `0.0.0.0:${AUDIT_GRPC_PORT}`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.connectMicroservice<GrpcOptions>({
    transport: Transport.GRPC,
    options: {
      package: AUDIT_V1_PACKAGE_NAME,
      protoPath: join(process.cwd(), AUDIT_PROTO_PATH),
      url: config.get<string>(
        'AUDIT_GRPC_BIND_URL',
        DEFAULT_AUDIT_GRPC_BIND_URL,
      ),
      loader: {
        enums: String,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(config.get('PORT', 3001));
}
bootstrap();
