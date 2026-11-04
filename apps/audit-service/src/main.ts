import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuditModule } from './audit.module';
import {join} from 'path'
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AuditModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.connectMicroservice<GrpcOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'audit.v1',
      protoPath: join(process.cwd(), 'libs/contracts/proto/audit.proto'),
      url: '0.0.0.0:50051',
      loader: {
        enums: String
      }
    },
  });
  const config = app.get(ConfigService);

  await app.startAllMicroservices()
  await app.listen(config.get('PORT', 3001));
}
bootstrap();
