import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import Redis from 'ioredis';

@Injectable()
export class HttpProxyService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}
  async forward(method: string, url: string, body: any, incomingHeaders: any) {
    const headers = { ...incomingHeaders };

    delete headers.host;
    delete headers['content-length'];
    delete headers.connection;

    const cacheKey = `CACHE:${method}:${url}`;

    if (method === 'GET') {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('💾 HIT CACHE →', cacheKey);
        return JSON.parse(cached);
      }
    }

    const response = await axios({
      method,
      url,
      data: body,
      headers,
      timeout: 5000,
      validateStatus: (status) => status < 400,
    });
    const result = {
      status: response.status,
      headers: response.headers,
      data: response.data ?? null,
    };

    // 🟩 Lưu cache cho GET
    if (method === 'GET' && response.status === 200) {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 30); // Cache 30s
      console.log('📝 SET CACHE →', cacheKey);
    }

    // 🟦 Xoá cache khi PUT/PATCH/DELETE
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Xoá toàn bộ cache GET danh sách users
      const userListPattern = `CACHE:GET:${process.env.USER_SERVICE_URL}/user-service/*`;
      const keys = await this.redis.keys(userListPattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log('🗑️ INVALIDATE USER LIST CACHE:', keys);
      }
    }

    return result;
  }
}
