import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'node:crypto';

export const CorrelationId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const correlationId = request.get('X-Request-Id');
    return correlationId ?? randomUUID();
  },
);
