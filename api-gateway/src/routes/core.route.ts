import { Controller, All, Req, Res, Post, Get } from '@nestjs/common';
import { HttpProxyService } from '../services/http-proxy.service';
import { Public } from 'common/public.decorator';

@Controller('core-service')
export class CoreRoute {
  constructor(private readonly proxy: HttpProxyService) {}

  @All('*path')
  async handleAll(@Req() req, @Res() res) {
    const strippedUrl = req.originalUrl.replace(/^\/api/, '');
    const url = `${process.env.CORE_SERVICE_URL}${strippedUrl}`;
    const method = req.method;
    const body = req.body;
    const headers = req.headers;

    console.log("GATE WAY TO CORE SERVICE:", url, method, body);
    

    try {
      const result = await this.proxy.forward(method, url, body, headers);
      return res.status(result.status).json(result.data);
    } catch (err) {
      console.log('❌ ERROR:', err.message);
      const status = err.response?.status || 500;
      const message = err.response?.data || 'Core Service Error';
      return res.status(status).json(message);
    }
  }
}
