import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GatewayModule,
  ],
})
export class AppModule {}
