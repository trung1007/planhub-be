import { Controller, All, Req, Res, Post } from '@nestjs/common';
import { HttpProxyService } from '../services/http-proxy.service';
import { Public } from 'common/public.decorator';

@Controller('auth')
export class AuthRoute {
  constructor(private readonly proxy: HttpProxyService) {}

  @All()
  handleRoot(@Req() req, @Res() res) {
    return this.handleAll(req, res);
  }

  @Public()
  @Post('login')
  login(@Req() req, @Res() res) {
    return this.handleAll(req, res);
  }
  @Public()
  @Post('register')
  register(@Req() req, @Res() res) {
    return this.handleAll(req, res);
  }
  @Public()
  @Post('refresh-token')
  refreshToken(@Req() req, @Res() res) {
    return this.handleAll(req, res);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Req() req, @Res() res) {
    return this.handleAll(req, res);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Req() req, @Res() res) {
    return this.handleAll(req, res);
  }

  @Public()
  @Post('logout')
  logout(@Req() req, @Res() res) {
    return this.handleAll(req, res);
  }

  @All('*path')
  async handleAll(@Req() req, @Res() res) {
    const strippedUrl = req.originalUrl.replace(/^\/api/, '');
    const url = `${process.env.USER_SERVICE_URL}${strippedUrl}`;
    const method = req.method;
    const body = req.body;
    const headers = req.headers;

    console.log('GATEWAY → AUTH:', { method, url, body });

    try {
      const result = await this.proxy.forward(method, url, body, headers);
      return res.status(result.status).json(result.data);
    } catch (err) {
      console.log('❌ ERROR:', err.message);
      const status = err.response?.status || 500;
      const message = err.response?.data || 'User Service Error';
      return res.status(status).json(message);
    }
  }
}
