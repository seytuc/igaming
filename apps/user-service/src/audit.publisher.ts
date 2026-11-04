import { Inject, Injectable, Logger } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import type { ClientGrpc } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import { firstValueFrom, timeout } from 'rxjs';
import {
  AuditLogEntityType,
  toProtoTimestamp,
  type AuditLogAction,
  type AuditServiceClient,
  type EventRecordRequest,
} from '@app/contracts';

@Injectable()
export class AuditPublisher {
  private readonly logger = new Logger(AuditPublisher.name);
  private readonly auditClient: AuditServiceClient;

  constructor(@Inject('AUDIT_PACKAGE') client: ClientGrpc) {
    this.auditClient = client.getService<AuditServiceClient>('AuditService');
  }

  public async publish(
    entityType: AuditLogEntityType,
    action: AuditLogAction,
    entityId: string,
    requestId: string,
  ): Promise<void> {
    const event: EventRecordRequest = {
      id: randomUUID(),
      action,
      entityType,
      entityId,
      timestamp: toProtoTimestamp(),
    };

    const metadata = new Metadata();
    metadata.set('x-correlation-id', requestId);

    try {
      await firstValueFrom(
        this.auditClient.eventRecord(event, metadata).pipe(timeout(2_000)),
      );
    } catch {
      this.logger.error({
        event: 'audit.delivery_failed',
        action,
        eventId: event.id,
        requestId,
      });
    }
  }
}
