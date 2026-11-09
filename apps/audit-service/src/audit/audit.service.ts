import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AuditLogEntityType,
  CORRELATION_ID_METADATA_KEY,
  EventRecordRequest,
  fromProtoTimestamp,
} from '@app/contracts';
import { AuditLogCreateData, AuditRepository } from './audit.repository';
import { Metadata, status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { isUUID } from 'class-validator';
import type { FindAuditLogsRequestDto } from './dto/find-audit-logs.request.dto';
import { AuditEntityType } from './enums/audit-entity-type.enum';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  public findAll(dto: FindAuditLogsRequestDto) {
    const { timestamp_from, timestamp_to } = dto;
    if (timestamp_from && timestamp_to) {
      if (new Date(timestamp_from).getTime() > new Date(timestamp_to).getTime())
        throw new BadRequestException(
          'created_from must not be later than created_to',
        );
    }
    return this.auditRepository.findAll(dto);
  }
  public async create(dto: EventRecordRequest, metadata: Metadata) {
    const [requestId] = metadata.get(CORRELATION_ID_METADATA_KEY);

    if (typeof requestId !== 'string' || !isUUID(requestId)) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'x-request-id must be a valid UUID',
      });
    }

    if (!isUUID(dto.id)) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Event id must be valid uuid',
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
      return AuditEntityType.User;
    }
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'unsupported type',
    });
  }
}
