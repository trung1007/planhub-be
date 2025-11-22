import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserServiceProxy } from './user-service.proxy';
import { ServiceTokenManager } from './service-token.manager';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // ensure env is available here
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    // JWT dùng ConfigService (giống AuthModule)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('SERVICE_JWT_SECRET'),
        signOptions: {
          issuer: config.get<string>('SERVICE_JWT_ISSUER'),
          expiresIn: '5m',
        },
      }),
    }),
  ],

  providers: [UserServiceProxy, ServiceTokenManager],
  exports: [UserServiceProxy, ServiceTokenManager],
})
export class SharedModule {}
