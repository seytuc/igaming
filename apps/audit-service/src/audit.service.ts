import { Injectable } from '@nestjs/common';
import {
  AuditLogEntityType,
  EventRecordRequest,
  fromProtoTimestamp,
} from '@app/contracts';
import { AuditLogCreateData, AuditRepository } from './audit.repository';
import { Metadata, status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { isUUID } from 'class-validator';
import type { FindAuditLogsRequestDto } from './models/dto/find-audit-logs.request.dto';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  public findAll(dto: FindAuditLogsRequestDto) {
    return this.auditRepository.findAll(dto);
  }
  public async create(dto: EventRecordRequest, metadata: Metadata) {
    const [requestId] = metadata.get('x-correlation-id');

    if (typeof requestId !== 'string' || !isUUID(requestId)) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'x-request-id must be a valid UUID',
      });
    }

    if (!dto.timestamp)
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'timestamp require',
      });

    const entityType = this.mapperEntityType(dto.entityType);
    const timestamp = fromProtoTimestamp(dto.timestamp);

    const data: AuditLogCreateData = {
      id: dto.id,
      action: dto.action,
      entityType,
      timestamp,
      entityId: dto.entityId,
      requestId,
    };

    return this.auditRepository.create(data);
  }

  private mapperEntityType(entityType: AuditLogEntityType): number {
    if (entityType === AuditLogEntityType.AUDIT_LOG_ENTITY_TYPE_USER) {
      return 1;
    }
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Unsupported audit entity type',
    });
  }
}
