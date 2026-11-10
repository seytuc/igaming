import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import {
  AUDIT_RPC,
  AUDIT_SERVICE_NAME,
  type EventRecordRequest,
} from '@app/contracts';
import { Metadata, status } from '@grpc/grpc-js';
import { FindAuditLogsRequestDto } from './dto/find-audit-logs.request.dto';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { defer, firstValueFrom, timeout } from 'rxjs';

@Controller()
export class AuditController {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly auditServiceService: AuditService,
  ) {}

  @Get('audit/logs')
  public findAll(@Query() dto: FindAuditLogsRequestDto) {
    return this.auditServiceService.findAll(dto);
  }

  @GrpcMethod(AUDIT_SERVICE_NAME, AUDIT_RPC.recordEvent)
  public recordEvent(data: EventRecordRequest, metadata: Metadata) {
    return this.auditServiceService.create(data, metadata);
  }

  @GrpcMethod(AUDIT_SERVICE_NAME, AUDIT_RPC.ping)
  public async ping() {
    try {
      await firstValueFrom(
        defer(() => this.sequelize.authenticate()).pipe(timeout(3000)),
      );
      return {};
    } catch {
      throw new RpcException({
        code: status.UNAVAILABLE,
        message: 'Audit database unavailable',
      });
    }
  }
}
