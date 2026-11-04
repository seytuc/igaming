import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { InjectConnection } from '@nestjs/sequelize';
import type { AuditServiceClient } from '@app/contracts';
import { defer, firstValueFrom, timeout } from 'rxjs';
import { Sequelize } from 'sequelize-typescript';
import { Public } from '../../../libs/decorators/public.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Public()
@Controller('health')
export class HealthController {
  private readonly auditClient: AuditServiceClient;

  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @Inject('AUDIT_PACKAGE') client: ClientGrpc,
  ) {
    this.auditClient = client.getService<AuditServiceClient>('AuditService');
  }

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

      const auditCheck = firstValueFrom(
        this.auditClient.ping({}).pipe(timeout(500)),
      );

      await Promise.all([databaseCheck, auditCheck]);

      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready' });
    }
  }
}
