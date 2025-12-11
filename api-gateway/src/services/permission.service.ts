import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface PermissionItem {
  id: number;
  code: string;
  method: string; // GET | POST | PUT | DELETE...
  url: string; // /tasks/:id ...
}

@Injectable()
export class PermissionService {
  constructor(private readonly http: HttpService) {}

  async getPermissions(
    userId: number,
    projectId: number,
  ): Promise<PermissionItem[]> {
    const response = await firstValueFrom(
      this.http.get(
        `${process.env.CORE_SERVICE_URL}/core-service/project-members/role-permissions`,
        {
          params: { userId, projectId },
        },
      ),
    );
    const rawPermissions = response.data?.permissions ?? [];

    const normalizedPermissions = rawPermissions.map((p: PermissionItem) => ({
      ...p,
      url: p.url.replace(/^\/api/, ''),
    }));
    
  
    return normalizedPermissions;
  }
}
