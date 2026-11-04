import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from './user.repository';
import { User } from './models/user/user.model';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { XApiKeyGurad } from '../common/guards/x-api-key.gurad';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuditPublisher } from './audit.publisher';
import { HealthController } from './health.conroller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.getOrThrow<string>('POSTGRES_HOST'),
        port: config.getOrThrow<number>('POSTGRES_PORT'),
        username: config.getOrThrow<string>('POSTGRES_USER'),
        password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: config.getOrThrow<string>('POSTGRES_DB'),
        autoLoadModels: false,
        synchronize: false,
        retryAttempts: 3,
        retryDelay: 2000,
        models: [User],
      }),
      inject: [ConfigService],
    }),
    ClientsModule.register([
      {
        name: 'AUDIT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'audit.v1',
          protoPath: join(process.cwd(), 'libs/contracts/proto/audit.proto'),
          url: '0.0.0.0:50051',
        },
      },
    ]),
    SequelizeModule.forFeature([User]),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
  ],
  controllers: [UserController, HealthController],
  providers: [
    UserService,
    UserRepository,
    AuditPublisher,
    { provide: APP_GUARD, useClass: XApiKeyGurad },
  ],
})
export class UserModule {}
