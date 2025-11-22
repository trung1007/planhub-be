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

    const path = new URL(url).pathname;
    const cacheKey = `CACHE:${method}:${path}`;
    console.log('cacheKey:', cacheKey);

    // GET cache
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

    // SET cache
    if (method === 'GET' && response.status === 200) {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 30);
      console.log('📝 SET CACHE →', cacheKey);
    }

    // INVALIDATE cache
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      let pattern: string | null = null;

      if (path.startsWith('/user-service/roles')) {
        pattern = 'CACHE:GET:/user-service/roles/*';
      } else if (path.startsWith('/user-service/users')) {
        pattern = 'CACHE:GET:/user-service/users/*';
      }else if (path.startsWith('/user-service/role-permissions')) {
        pattern = 'CACHE:GET:/user-service/role-permissions/*';
      }

      if (path.startsWith('/core-service/')) {
        pattern = `CACHE:GET:/core-service/*`;
      }

      if (pattern) {
        const keys = await this.redis.keys(pattern);

        if (keys.length > 0) {
          await this.redis.del(...keys);
          console.log(`🗑️ INVALIDATE CACHE for ${pattern}:`, keys);
        } else {
          console.log(`⚠️ No cache keys matched pattern: ${pattern}`);
        }
      }
    }

    return result;
  }
}
