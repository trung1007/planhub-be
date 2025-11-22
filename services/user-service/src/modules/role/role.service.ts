import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Role } from './role.entity';
import { Permission } from '../permission/permission.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { User } from '../user/user.entity';
import { RoleDetailResponseDto } from './dto/role-detail-response.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);

    const qb = this.roleRepository
      .createQueryBuilder('role')
      .leftJoin(User, 'createdByUser', 'createdByUser.id = role.created_by')
      .addSelect(['createdByUser.id', 'createdByUser.username'])
      .leftJoin(User, 'updatedByUser', 'updatedByUser.id = role.updated_by')
      .addSelect(['updatedByUser.id', 'updatedByUser.username'])
      .skip((pageNumber - 1) * limitNumber)
      .take(limitNumber)
      .orderBy('role.id', 'ASC');

    const rolesRaw = await qb.getRawMany();
    const total = await qb.getCount();

    const items = rolesRaw.map((raw) => {
      // Tạo Role entity đúng
      const roleEntity = new Role();
      Object.assign(roleEntity, {
        id: raw.role_id,
        name: raw.role_name,
        key: raw.role_key,
        description: raw.role_description,
        createdAt: raw.role_created_at,
        updatedAt: raw.role_updated_at,
        createdBy: raw.createdByUser_username,
        updatedBy: raw.updatedByUser_username,
      });

      return roleEntity;
    });

    return {
      items,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    };
  }
  async findList() {
    return this.roleRepository.find({
      select: ['id', 'key'],
      order: { key: 'ASC' },
    });
  }
  
  async findOne(id: number): Promise<RoleDetailResponseDto> {
    const role = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .where('role.id = :id', { id })
      .getOne();

    if (!role) throw new NotFoundException('Role not found');

    return this.mapRoleToDetailDto(role);
  }

  async create(dto: CreateRoleDto) {
    const createdUser = await this.userRepo.findOne({
      where: { id: dto.createdUserId },
    });
    if (!createdUser)
      throw new NotFoundException(`User ${dto.createdUserId} not found`);
    const existingRole = await this.roleRepository.findOne({
      where: { key: dto.key },
    });

    if (existingRole) {
      throw new BadRequestException(
        `Role with key '${dto.key}' already exists`,
      );
    }
    const role = this.roleRepository.create(dto);
    role.createdBy = dto.createdUserId;
    return this.roleRepository.save(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    const updatedUser = await this.userRepo.findOne({
      where: { id: dto.updatedUserId },
    });
    if (!updatedUser)
      throw new NotFoundException(`User ${dto.updatedUserId} not found`);

    if (dto.key && dto.key !== role.key) {
      const existingRole = await this.roleRepository.findOne({
        where: { key: dto.key },
      });

      if (existingRole) {
        throw new BadRequestException(
          `Role with key '${dto.key}' already exists`,
        );
      }
    }

    Object.assign(role, dto);

    role.updatedBy = dto.updatedUserId;

    return this.roleRepository.save(role);
  }

  async delete(id: number) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    await this.roleRepository.delete(id);
    return { message: 'Role deleted successfully' };
  }

  private mapRoleToDetailDto(role: Role): RoleDetailResponseDto {
    const permissions = role.rolePermissions?.map((rp) => rp.permission) || [];

    return {
      id: role.id,
      name: role.name,
      key: role.key,
      permissions,
    };
  }
}
