import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    return new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(String(process.env.REDIS_PORT)) || 6379,
    });
  },
};
