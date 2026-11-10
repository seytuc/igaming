import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

export class IpThrottlerGuard extends ThrottlerGuard {
  protected generateKey(_context: ExecutionContext, ip: string) {
    return `${ip}`;
  }
}
