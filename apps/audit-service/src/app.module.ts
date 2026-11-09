import { Module } from '@nestjs/common';
import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';
import { AuditRepository } from './audit/audit.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLog } from './audit/models/audit-log.model';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.getOrThrow<string>('AUDIT_DB_HOST'),
        port: config.getOrThrow<number>('AUDIT_DB_PORT'),
        username: config.getOrThrow<string>('AUDIT_DB_USER'),
        password: config.getOrThrow<string>('AUDIT_DB_PASSWORD'),
        database: config.getOrThrow<string>('AUDIT_DB_NAME'),
        autoLoadModels: false,
        synchronize: false,
        retryAttempts: 3,
        retryDelay: 2000,
        models: [AuditLog],
      }),
      inject: [ConfigService],
    }),
    SequelizeModule.forFeature([AuditLog]),
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
})
export class AppModule {}
