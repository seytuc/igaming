import { Module } from '@nestjs/common';
import { AuditClientModule } from '../audit-client/audit-client.module';
import { HealthController } from './health.controller';

@Module({
  imports: [AuditClientModule],
  controllers: [HealthController],
})
export class HealthModule {}
