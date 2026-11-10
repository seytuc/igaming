import { Inject, Injectable, Logger } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import type { ClientGrpc } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import { firstValueFrom, timeout } from 'rxjs';
import {
  AuditLogEntityType,
  AUDIT_SERVICE_NAME,
  CORRELATION_ID_METADATA_KEY,
  toProtoTimestamp,
  type AuditLogAction,
  type AuditServiceClient,
  type EventRecordRequest,
} from '@app/contracts';

export const AUDIT_CLIENT_TOKEN = 'AUDIT_PACKAGE';

@Injectable()
export class AuditGrpcClient {
  private readonly logger = new Logger(AuditGrpcClient.name);
  private readonly auditClient: AuditServiceClient;

  constructor(@Inject(AUDIT_CLIENT_TOKEN) client: ClientGrpc) {
    this.auditClient =
      client.getService<AuditServiceClient>(AUDIT_SERVICE_NAME);
  }

  public async ping(): Promise<void> {
    await firstValueFrom(this.auditClient.ping({}).pipe(timeout(500)));
  }

  public async recordEvent(
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
    metadata.set(CORRELATION_ID_METADATA_KEY, requestId);

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
