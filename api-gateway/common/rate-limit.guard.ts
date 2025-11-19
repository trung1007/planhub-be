import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Identify client — dùng IP (hoặc userId nếu đã login)
    // Lấy IP dạng IPv4
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    if (ip === '::1') ip = '127.0.0.1';

    if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }
    const key = `rate_limit:${ip}`;

    // Increase count
    const count = await this.redis.incr(key);

    // Set TTL ngay lần đầu
    if (count === 1) {
      await this.redis.expire(key, 60);
    }

    const LIMIT = 60;

    if (count > LIMIT) {
      throw new HttpException(
        `Too many requests, limit is ${LIMIT}/minute`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
