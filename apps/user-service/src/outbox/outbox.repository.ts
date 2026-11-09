import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OutboxEvent } from './outbox.model';
import {
  AuditLogAction,
  AuditLogEntityType,
  EventRecordRequest,
  toProtoTimestamp,
} from '@app/contracts';
import { Transaction } from 'sequelize';
import { randomUUID } from 'node:crypto';

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectModel(OutboxEvent) private readonly outboxEvent: typeof OutboxEvent,
  ) {}

  public async enqueue(
    entityType: AuditLogEntityType,
    action: AuditLogAction,
    entityId: string,
    requestId: string,
    transaction: Transaction,
  ) {
    const id = randomUUID();
    const event: EventRecordRequest = {
      id,
      entityType,
      action,
      entityId,
      timestamp: toProtoTimestamp(),
    };

    return this.outboxEvent.create(
      {
        id,
        event,
        requestId,
        attempts: 0,
        availableAt: new Date(),
      },
      { transaction },
    );
  }
}
