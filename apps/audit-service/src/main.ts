import { NestFactory } from '@nestjs/core';
import { AuditModule } from './audit.module';
import {join} from 'path'
import { GrpcOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AuditModule);
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
  await app.startAllMicroservices()
  await app.listen(3001);
}
bootstrap();
