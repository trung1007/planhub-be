import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';
import { DeleteRolePermissionDto } from './dto/delete-role-permission.dto';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private repo: Repository<RolePermission>,
  ) {}

  async create(dto: CreateRolePermissionDto) {
    const { role_id, permissionIds } = dto;

    const existing = await this.repo.find({
      where: { role_id, permission_id: In(permissionIds) },
    });

    const existingIds = new Set(existing.map((rp) => rp.permission_id));

    const newIds = permissionIds.filter((pid) => !existingIds.has(pid));

    if (newIds.length === 0) return [];

    const rows = newIds.map((pid) => ({
      role_id,
      permission_id: pid,
    }));

    return this.repo.save(rows);
  }

  async getPermissionsByRole(roleId: number, page = 1, limit = 10) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);

    // Query phân trang permission
    const qb = this.repo
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .where('rp.role_id = :roleId', { roleId })
      .skip((pageNumber - 1) * limitNumber)
      .take(limitNumber);

    const [rolePermissions, total] = await qb.getManyAndCount();

    const permissions = rolePermissions.map((rp) => rp.permission);

    return {
      items: permissions,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    };
  }

  findAll() {
    return this.repo.find({
      relations: ['role', 'permission'],
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['role', 'permission'],
    });

    if (!item) throw new NotFoundException('RolePermission not found');

    return item;
  }
  async getAllRolePermissionIds(roleId: number) {
    const list = await this.repo.find({
      where: { role_id: roleId },
      select: ['permission_id'],
    });

    return { ids: list.map((item) => item.permission_id) };
  }

  async update(id: number, dto: UpdateRolePermissionDto) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('RolePermission not found');

    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(dto: DeleteRolePermissionDto) {
    const { role_id, permissionIds } = dto;

    if (!permissionIds || permissionIds.length === 0) {
      return { message: 'No permissionIds provided' };
    }
    const existing = await this.repo.find({
      where: { role_id, permission_id: In(permissionIds) },
    });

    if (existing.length === 0) {
      return { message: 'No matching permissions to delete' };
    }

    const idsToDelete = existing.map((item) => item.id);

    await this.repo.delete(idsToDelete);

    return {
      deleted: idsToDelete.length,
      ids: idsToDelete,
    };
  }
}
