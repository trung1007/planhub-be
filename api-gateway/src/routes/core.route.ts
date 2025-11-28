import {
  Controller,
  All,
  Req,
  Res,
  Post,
  Get,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { HttpProxyService } from '../services/http-proxy.service';

@Controller('core-service')
export class CoreRoute {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post('attachments')
  async forwardAttachment(@Req() req, @Res() res) {
    const url = `${process.env.CORE_SERVICE_URL}/core-service/attachments`;

    try {
      const result = await this.proxy.forwardStream(req, url);

      res.status(result.status);
      if (result.data) {
        return res.send(result.data);
      }
      return res.end();
    } catch (err) {
      console.error('❌ Gateway Error:', err?.message);
      return res.status(500).json({ message: 'Core Service Error' });
    }
  }

  @Get('attachments/download/:id')
  async download(@Req() req, @Res() res) {
    const strippedUrl = req.originalUrl.replace(/^\/api/, '');
    const url = `${process.env.CORE_SERVICE_URL}${strippedUrl}`;
    const result = await this.proxy.forwardDownload(req, url);

    Object.entries(result.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // STREAM FILE NHƯNG KHÔNG JSON HOÁ
    result.data.pipe(res);
  }

  @All('*path')
  async handleAll(@Req() req, @Res() res) {
    const strippedUrl = req.originalUrl.replace(/^\/api/, '');
    const url = `${process.env.CORE_SERVICE_URL}${strippedUrl}`;
    const method = req.method;
    const body = req.body;
    const headers = req.headers;

    // console.log('Gateway Request Method:', method); // Log method
    // console.log('Gateway Request URL:', url); // Log URL
    // console.log('Gateway Request Headers:', headers); // Log headers
    // console.log('Gateway Request Body:', body); // Log body
    try {
      const result = await this.proxy.forward(req, method, url, body, headers);
      return res.status(result.status).json(result.data);
    } catch (err) {
      console.log('❌ ERROR:', err.message);
      const status = err.response?.status || 500;
      const message = err.response?.data || 'Core Service Error';
      return res.status(status).json(message);
    }
  }
}
