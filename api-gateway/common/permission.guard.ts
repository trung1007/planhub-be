import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import { PermissionService } from 'src/services/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly ignoreRoutes: string[] = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password',
    '/auth/forgot-password',
    '/auth/logout',
    '/user-service/roles',
    '/user-service/users',
    '/user-service/role-permissions',
  ];

  constructor(private readonly permissionService: PermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const url = req.originalUrl.replace(/^\/api/, '');

    const isRoleAdmin = req?.user?.role === 'admin';
    if (isRoleAdmin) {
      return true;
    }

    // // add account ADMIN later
    // if (url.startsWith('/core-service/projects') && req.method === 'GET') {
    //   return true;
    // }

    // Nếu URL thuộc danh sách ignore → cho qua luôn
    if (this.ignoreRoutes.some((route) => url.startsWith(route))) {
      return true;
    }

    if (req.method === 'GET') return true;

    const userId = req.user?.id;
    const projectId = req.headers['x-project-id'];

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!projectId) {
      throw new ForbiddenException('Missing projectId');
    }

    // Gọi core-service để lấy role + permissions
    const data = await this.permissionService.getPermissions(
      Number(userId),
      Number(projectId),
    );

    const permissions = data ?? [];

    console.log(permissions);
    

    // Nếu không có permission → cấm
    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new ForbiddenException(
        'Users do not have this permission in this project.',
      );
    }

    const method = this.normalizeMethod(req.method);
    const requestUrl = this.normalizeUrl(url);

    console.log('method:', method);
    console.log('requestUrl:', requestUrl);

    // Check xem permission có khớp method + url không
    const isAllowed = permissions.some((p) => {
      return (
        p.method?.toUpperCase() === method && this.matchUrl(p.url, requestUrl)
      );
    });

    if (!isAllowed) {
      throw new ForbiddenException(
        `Permission denied: ${method} ${requestUrl}`,
      );
    }

    return true;
  }

  private normalizeMethod(method: string): string {
    method = method.toUpperCase();

    // Nếu request là PATCH thì xem như PUT
    if (method === 'PATCH') return 'PUT';

    return method;
  }

  // Chuẩn hóa URL (xoá query params)
  private normalizeUrl(url: string): string {
    return url.split('?')[0];
  }

  // So khớp URL có chứa tham số ví dụ:
  // /tasks/:id -> /tasks/55
  private matchUrl(pattern: string, actual: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    return regex.test(actual);
  }
}
