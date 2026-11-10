import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SequelizeModule } from '@nestjs/sequelize';
import { XApiKeyGuard } from './auth/x-api-key.guard';
import { HealthModule } from './health/health.module';
import { User } from './users/models/user.model';
import { UsersModule } from './users/users.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { IpThrottlerGuard } from './auth/ip-throttler.guard';
import { OutboxEvent } from './outbox/outbox.model';
import { OutboxModule } from './outbox/outbox.module';

const RATE_LIMIT_PER_MINUTE = 120;
const RATE_LIMIT_WINDOW_MS = 60000;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.getOrThrow<string>('USER_DB_HOST'),
        port: config.getOrThrow<number>('USER_DB_PORT'),
        username: config.getOrThrow<string>('USER_DB_USER'),
        password: config.getOrThrow<string>('USER_DB_PASSWORD'),
        database: config.getOrThrow<string>('USER_DB_NAME'),
        autoLoadModels: false,
        synchronize: false,
        retryAttempts: 3,
        retryDelay: 2000,
        models: [User, OutboxEvent],
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      { ttl: RATE_LIMIT_WINDOW_MS, limit: RATE_LIMIT_PER_MINUTE },
    ]),
    UsersModule,
    HealthModule,
    OutboxModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: XApiKeyGuard },
    { provide: APP_GUARD, useClass: IpThrottlerGuard },
  ],
})
export class AppModule {}
