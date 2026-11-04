import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  AUDIT_RPC,
  AUDIT_SERVICE_NAME,
  type EventRecordRequest,
} from '@app/contracts';
import { Metadata } from '@grpc/grpc-js';
import { FindAuditLogsRequestDto } from './dto/find-audit-logs.request.dto';

@Controller()
export class AuditController {
  constructor(private readonly auditServiceService: AuditService) {}

  @Get('audit/logs')
  public findAll(@Query() dto: FindAuditLogsRequestDto) {
    return this.auditServiceService.findAll(dto);
  }

  @GrpcMethod(AUDIT_SERVICE_NAME, AUDIT_RPC.recordEvent)
  public recordEvent(data: EventRecordRequest, metadata: Metadata) {
    return this.auditServiceService.create(data, metadata);
  }

  @GrpcMethod(AUDIT_SERVICE_NAME, AUDIT_RPC.ping)
  public ping() {
    return {};
  }
}
