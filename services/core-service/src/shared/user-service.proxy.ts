import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceTokenManager } from './service-token.manager';

export interface UserProxyEntity {
  id: number;
  username: string;
  fullName: string;
  // thêm các field khác nếu có
}

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
            'x-from-core-service': 'true',
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error?.message);
      return null;
    }
  }

  async getUsersByIds(ids: number[]) {
    try {
      const token = this.tokenManager.getToken();
      const response = await firstValueFrom(
        this.http.post(
          `${this.gatewayUrl}/user-service/users/list-by-ids`,
          { ids }, // body
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'x-from-core-service': 'true',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching users by ids:', error?.message);
      return [];
    }
  }

  async getRoleById(id: number) {
    try {
      const token = this.tokenManager.getToken();
      const response = await firstValueFrom(
        this.http.get(`${this.gatewayUrl}/user-service/roles/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-from-core-service': 'true',
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
