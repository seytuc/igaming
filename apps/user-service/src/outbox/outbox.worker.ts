import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OutboxEvent } from './outbox.model';
import { AuditGrpcClient } from '../audit-client/audit-grpc.client';
import { Op } from 'sequelize';

@Injectable()
export class OutboxWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorker.name);

  private stopped = false;
  private running?: Promise<void>;

  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(OutboxEvent) private readonly outboxEvent: typeof OutboxEvent,
    private readonly auditClient: AuditGrpcClient,
  ) {}

  onApplicationBootstrap() {
    this.running = this.run();
  }

  async onModuleDestroy() {
    this.stopped = true;
    await this.running;
  }

  private async run() {
    while (!this.stopped) {
      try {
        await this.processOne();
      } catch (error) {
        this.logger.error(error);
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  private async processOne() {
    await this.sequelize.transaction({ logging: false }, async (tx) => {
      const row = await this.outboxEvent.findOne({
        where: { availableAt: { [Op.lte]: new Date() } },
        order: [
          ['availableAt', 'ASC'],
          ['id', 'ASC'],
        ],
        lock: tx.LOCK.UPDATE,
        skipLocked: true,
        transaction: tx,
        logging: false,
      });
      if (!row) return;
      try {
        await this.auditClient.sendEvent(row.event, row.requestId);
        this.logger.debug({
          message: 'Audit delivery success',
          eventId: row.id,
          request_id: row.requestId,
        });
      } catch {
        await row.update(
          {
            attempts: row.attempts + 1,
            availableAt: new Date(Date.now() + 5000),
          },
          { transaction: tx, logging: false },
        );

        this.logger.warn({
          message: 'Audit delivery failed',
          eventId: row.id,
          requestId: row.requestId,
        });
        return;
      }
      await row.destroy({ transaction: tx, logging: false });
    });
  }
}
