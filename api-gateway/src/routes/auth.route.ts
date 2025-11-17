import { Controller, All, Req, Res } from '@nestjs/common';
import { HttpProxyService } from '../services/http-proxy.service';

@Controller('auth')
export class AuthRoute {
 

  constructor(private readonly proxy: HttpProxyService) {}

  @All()
  handleRoot(@Req() req, @Res() res) {
    return this.handleAll(req, res);
  }

  @All('*path')
  async handleAll(@Req() req, @Res() res) {
    // const strippedUrl = req.originalUrl.replace('/api/v1', '');
    const url = `${process.env.USER_SERVICE_URL}${req.originalUrl}`;
    const method = req.method;
    const body = req.body;
    const headers = req.headers;

    console.log('GATEWAY → AUTH:', { method, url, body });

    try {
      const result = await this.proxy.forward(method, url, body, headers);
      console.log('⬅️ Auth Service trả về:', result);
      return res.json(result);
    } catch (err) {
      console.log('❌ ERROR:', err.message);
      const status = err.response?.status || 500;
      const message = err.response?.data || 'User Service Error';
      return res.status(status).json(message);
    }
  }
}
