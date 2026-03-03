import type { Environment } from '@config';
import { API_KEY_HEADER } from '@core/constants';
import { IS_PUBLIC_KEY } from '@core/decorators';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService<Environment, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.configService.get('API_KEY', { infer: true });
    const requestApiKey = request.header(API_KEY_HEADER)?.trim();

    if (!requestApiKey || requestApiKey !== apiKey) {
      throw new UnauthorizedException('Unauthorized request.');
    }

    return true;
  }
}
