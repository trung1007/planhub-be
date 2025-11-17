import { Module } from '@nestjs/common';
import { UserRoute } from './routes/user.route';
import { HttpProxyService } from './services/http-proxy.service';
import { AuthRoute } from './routes/auth.route';

@Module({
  controllers: [UserRoute, AuthRoute],
  providers: [HttpProxyService],
})
export class GatewayModule {}
