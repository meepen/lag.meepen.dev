import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiSecretGuard implements CanActivate {
  private readonly apiSecret: string;
  constructor(private readonly configService: ConfigService) {
    this.apiSecret = this.configService.getOrThrow<string>('API_SECRET');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    return authHeader === this.apiSecret;
  }
}
