import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HttpProxyService {
  async forward(method: string, url: string, body: any, incomingHeaders: any) {
    const headers = { ...incomingHeaders };

    delete headers.host;
    delete headers['content-length'];
    delete headers.connection;
    const response = await axios({
      method,
      url,
      data: body,
      headers,
      timeout: 5000,
    });

    return response.data;
  }
}
