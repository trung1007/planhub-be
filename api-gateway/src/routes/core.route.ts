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
import { Public } from 'common/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Blob } from 'node-fetch';
import FormData from 'form-data';

@Controller('core-service')
export class CoreRoute {
  constructor(private readonly proxy: HttpProxyService) {}

  // @Post('attachments')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     limits: {
  //       fileSize: 10 * 1024 * 1024, // Giới hạn file size 10MB
  //     },
  //   }),
  // )
  // async uploadFile(
  //   @Req() req,
  //   @Res() res,
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() body: any,
  // ) {
  //   const method = req.method;
  //   const url = `${process.env.CORE_SERVICE_URL}/core-service/attachments`;
  //   const headers = req.headers;

  //   const form = new FormData();

  //   form.append('file', file.buffer, {
  //     filename: file.originalname,
  //     contentType: file.mimetype,
  //   });
  //   form.append('issueId', String(body.issueId ?? body.issue_id));

  //   if (!file) {
  //     throw new BadRequestException('No file uploaded');
  //   }

  //   // Kiểm tra nếu không có dữ liệu file trong buffer
  //   if (!file.buffer) {
  //     throw new BadRequestException('File buffer is missing');
  //   }

  //   try {
  //     const result = await this.proxy.forward(method, url, form, headers, true);
  //     return res.status(result.status).json(result.data);
  //   } catch (err) {
  //     console.log('❌ ERROR:', err.message);
  //     const status = err.response?.status || 500;
  //     const message = err.response?.data || 'Core Service Error';
  //     return res.status(status).json(message);
  //   }
  // }

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

    console.log('Gateway Request Method:', method); // Log method
    console.log('Gateway Request URL:', url); // Log URL
    console.log('Gateway Request Headers:', headers); // Log headers
    console.log('Gateway Request Body:', body); // Log body
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
