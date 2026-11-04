import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../../../../libs/decorators/public.decorator';

@Injectable()
export class XApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const xApiKey = request.get('X-API-KEY');
    if (!xApiKey) throw new UnauthorizedException('require x-api-key');
    if (xApiKey === this.configService.getOrThrow<string>('X-API-KEY'))
      return true;
    else throw new UnauthorizedException('invalid x-api-key');
  }
}
