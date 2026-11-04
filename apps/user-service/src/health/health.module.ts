import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditClientModule } from '../audit-client/audit-client.module';
import { HealthController } from './health.controller';

const RATE_LIMIT_PER_MINUTE = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;

@Module({
  imports: [
    AuditClientModule,
    ThrottlerModule.forRoot([
      { ttl: RATE_LIMIT_WINDOW_MS, limit: RATE_LIMIT_PER_MINUTE },
    ]),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
