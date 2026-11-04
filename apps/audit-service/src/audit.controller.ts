import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GrpcMethod } from '@nestjs/microservices';
import type { EventRecordRequest } from '@app/contracts';
import { Metadata } from '@grpc/grpc-js';
import { FindAuditLogsRequestDto } from './models/dto/find-audit-logs.request.dto';

@Controller()
export class AuditController {
  constructor(private readonly auditServiceService: AuditService) {}

  @Get('audit/logs')
  public findAll(
    @Query(new ValidationPipe({ transform: true })) dto: FindAuditLogsRequestDto,
  ) {
    return this.auditServiceService.findAll(dto);
  }

  @GrpcMethod('AuditService', 'EventRecord')
  public recordEvent(data: EventRecordRequest, metadata: Metadata) {
    return this.auditServiceService.create(data, metadata);
  }

  @GrpcMethod('AuditService', 'Ping')
  public ping() {
    return {};
  }
}
