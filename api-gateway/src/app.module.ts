import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway.module';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from 'common/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RedisProvider } from './redis/redis.provider';
import { RateLimitGuard } from 'common/rate-limit.guard';
import { PermissionGuard } from 'common/permission.guard';
import { HttpModule } from '@nestjs/axios';
import { PermissionService } from './services/permission.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GatewayModule,
    HttpModule,
  ],
  providers: [
    RedisProvider,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    PermissionService
  ],
})
export class AppModule {}
