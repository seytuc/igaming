import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { isUUID } from 'class-validator';

export const CorrelationId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.get('X-Request-Id');

    if (requestId === undefined) {
      return randomUUID();
    }

    if (!isUUID(requestId)) {
      throw new BadRequestException('X-Request-Id must be a valid UUID');
    }

    return requestId;
  },
);
