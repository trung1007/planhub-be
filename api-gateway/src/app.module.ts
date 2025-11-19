import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway.module';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from 'common/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RedisProvider } from './redis/redis.provider';
import { RateLimitGuard } from 'common/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GatewayModule,
  ],
  providers: [
    // RedisProvider,
    // {
    //   provide: APP_GUARD,
    //   useClass: RateLimitGuard,
    // },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
