import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceTokenManager } from './service-token.manager';


@Injectable()
export class UserServiceProxy {
  private gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';

  constructor(
    private readonly http: HttpService,
    private readonly tokenManager: ServiceTokenManager,
  ) {}

  async getUserById(id: number) {
    try {
      const token = this.tokenManager.getToken();
      const response = await firstValueFrom(
        this.http.get(`${this.gatewayUrl}/user-service/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error?.message);
      return null;
    }
  }
}
