import { Module } from '@nestjs/common';
import { UserRoute } from './routes/user.route';
import { HttpProxyService } from './services/http-proxy.service';
import { AuthRoute } from './routes/auth.route';
import { RedisProvider } from './redis/redis.provider';
import { CoreRoute } from './routes/core.route';

@Module({
  controllers: [UserRoute, AuthRoute, CoreRoute],
  providers: [HttpProxyService, RedisProvider],
})
export class GatewayModule {}
