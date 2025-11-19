import { Controller, All, Req, Res, Post, Get } from '@nestjs/common';
import { HttpProxyService } from '../services/http-proxy.service';
import { Public } from 'common/public.decorator';

@Controller('userservice')
export class UserRoute {
  constructor(private readonly proxy: HttpProxyService) {}

  @All('*path')
  async handleAll(@Req() req, @Res() res) {
    // const strippedUrl = req.originalUrl.replace('/api/v1', '');
    const url = `${process.env.USER_SERVICE_URL}${req.originalUrl}`;
    const method = req.method;
    const body = req.body;
    const headers = req.headers;

    try {
      const result = await this.proxy.forward(method, url, body, headers);
      console.log('⬅️ User Service trả về:', result);
      return res.status(result.status).json(result.data);
    } catch (err) {
      console.log('❌ ERROR:', err.message);
      const status = err.response?.status || 500;
      const message = err.response?.data || 'User Service Error';
      return res.status(status).json(message);
    }
  }
}
