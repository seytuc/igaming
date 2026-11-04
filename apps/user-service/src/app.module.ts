import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SequelizeModule } from '@nestjs/sequelize';
import { XApiKeyGuard } from './auth/x-api-key.guard';
import { HealthModule } from './health/health.module';
import { User } from './users/models/user.model';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    UsersModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: XApiKeyGuard }],
})
export class AppModule {}
