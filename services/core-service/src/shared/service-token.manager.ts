import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ServiceTokenManager {
  private token: string | null = null;
  private tokenExpireAt: number | null = null; // timestamp

  constructor(private readonly jwtService: JwtService) {}

  getToken(): string {
    const now = Date.now();

    if (!this.token || !this.tokenExpireAt || now >= this.tokenExpireAt) {
      const payload = {
        type: 'service',
        service: 'core-service',
      };

      this.token = this.jwtService.sign(payload);

      const decoded: any = this.jwtService.decode(this.token);
      this.tokenExpireAt = decoded.exp * 1000;
    }

    return this.token;
  }
}
