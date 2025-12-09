import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CoreServiceProxy {
  constructor(private readonly http: HttpService) {}

  async getProjectMembers(userId: number) {
    try {
      const url = `${process.env.CORE_SERVICE_URL}/core-service/project-members/member-role/${userId}`;
      const response = await firstValueFrom(this.http.get(url));
      return response.data;
    } catch (err) {
      return [];
    }
  }
}
