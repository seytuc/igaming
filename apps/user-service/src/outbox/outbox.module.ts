import { Module } from '@nestjs/common';
import { OutboxRepository } from './outbox.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { OutboxEvent } from './outbox.model';
import { AuditClientModule } from '../audit-client/audit-client.module';
import { OutboxWorker } from './outbox.worker';

@Module({
  imports: [SequelizeModule.forFeature([OutboxEvent]), AuditClientModule],
  providers: [OutboxRepository, OutboxWorker],
  exports: [OutboxRepository],
})
export class OutboxModule {}
