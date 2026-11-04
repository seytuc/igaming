import {
  AUDIT_GRPC_PORT,
  AUDIT_PROTO_PATH,
  AUDIT_V1_PACKAGE_NAME,
} from '@app/contracts';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { AUDIT_CLIENT_TOKEN, AuditGrpcClient } from './audit-grpc.client';

const DEFAULT_AUDIT_GRPC_URL = `127.0.0.1:${AUDIT_GRPC_PORT}`;

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUDIT_CLIENT_TOKEN,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: AUDIT_V1_PACKAGE_NAME,
            protoPath: join(process.cwd(), AUDIT_PROTO_PATH),
            url: config.get<string>('AUDIT_GRPC_URL', DEFAULT_AUDIT_GRPC_URL),
          },
        }),
      },
    ]),
  ],
  providers: [AuditGrpcClient],
  exports: [AuditGrpcClient],
})
export class AuditClientModule {}
