import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const authHeader = req.headers['authorization'];
    if (!authHeader)
      throw new UnauthorizedException('Missing Authorization header');

    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Invalid Bearer token');

    const serviceSecret = process.env.SERVICE_JWT_SECRET;
    if (!serviceSecret)
      throw new UnauthorizedException('SERVICE_JWT_SECRET missing');

    for (let i = 0; i < 3; i++) {
      try {
        const decoded: any = jwt.verify(token, serviceSecret);
        if (decoded && decoded.type === 'service') {
          req.service = decoded.service;
          return true;
        }
      } catch (_) {
        // thử verify lại
      }
    }

    const userSecret = process.env.JWT_SECRET;
    if (!userSecret) throw new UnauthorizedException('JWT_SECRET missing');
    try {
      const userDecoded: any = jwt.verify(token, userSecret);
      req.user = userDecoded;
      return true;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Access token expired');
      }

      // ⚠️ Token sai, bị chỉnh sửa, không hợp lệ
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid access token');
      }

      // ⚠️ Các lỗi khác
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
