import {
  Controller,
  Get,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { defer, firstValueFrom, timeout } from 'rxjs';
import { Sequelize } from 'sequelize-typescript';
import { Public } from '../../../../libs/decorators/public.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuditGrpcClient } from '../audit-client/audit-grpc.client';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly auditClient: AuditGrpcClient,
  ) {}

  @Get('live')
  public live() {
    return { status: 'ok' };
  }

  @Get('ready')
  public async ready() {
    try {
      const databaseCheck = firstValueFrom(
        defer(() => this.sequelize.authenticate()).pipe(timeout(1000)),
      );

      const auditCheck = this.auditClient.ping();

      await Promise.all([databaseCheck, auditCheck]);

      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready' });
    }
  }
}
