import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import Redis from 'ioredis';

@Injectable()
export class HttpProxyService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}
  async forward(
    method: string,
    url: string,
    body: any,
    incomingHeaders: any,
    isFormData?: boolean,
  ) {
    let headers = { ...incomingHeaders };

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

    if (isFormData) {
      const formHeaders = body.getHeaders();
      headers = {
        authorization: headers.authorization,
        ...formHeaders,
      };
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

    await this.invalidateCache(method, path);

    // INVALIDATE cache
    // if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    //   let pattern: string | null = null;

    //   if (path.startsWith('/user-service/roles')) {
    //     pattern = 'CACHE:GET:/user-service/roles/*';
    //   } else if (path.startsWith('/user-service/users')) {
    //     pattern = 'CACHE:GET:/user-service/users/*';
    //   } else if (path.startsWith('/user-service/role-permissions')) {
    //     pattern = 'CACHE:GET:/user-service/role-permissions/*';
    //   }

    //   if (path.startsWith('/core-service/')) {
    //     pattern = `CACHE:GET:/core-service/*`;
    //   }

    //   if (pattern) {
    //     const keys = await this.redis.keys(pattern);

    //     if (keys.length > 0) {
    //       await this.redis.del(...keys);
    //       console.log(`🗑️ INVALIDATE CACHE for ${pattern}:`, keys);
    //     } else {
    //       console.log(`⚠️ No cache keys matched pattern: ${pattern}`);
    //     }
    //   }
    // }

    return result;
  }

  async forwardStream(req, url: string) {
    const response = await axios({
      method: req.method,
      url,
      headers: { ...req.headers },
      data: req,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    // ===== IMPORTANT: invalidate cache =====
    const path = new URL(url).pathname;
    await this.invalidateCache(req.method, path);

    return response;
  }

  async forwardDownload(req, url: string) {
    return axios({
      method: req.method,
      url,
      headers: {
        ...req.headers,
      },
      responseType: 'stream',
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    });
  }

  private async invalidateCache(method: string, path: string) {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return;
    }

    let pattern: string | null = null;

    if (path.startsWith('/user-service/roles')) {
      pattern = 'CACHE:GET:/user-service/roles/*';
    } else if (path.startsWith('/user-service/users')) {
      pattern = 'CACHE:GET:/user-service/users/*';
    } else if (path.startsWith('/user-service/role-permissions')) {
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
}
