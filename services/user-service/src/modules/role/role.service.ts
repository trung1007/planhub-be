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
import { RoleResponseDto } from './dto/role-response.dto';
import { RoleListResponseDto } from './dto/role-list-response.dto';
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

    // Query lấy dữ liệu + đếm tổng
    const [roles, total] = await this.roleRepository.findAndCount({
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      order: { id: 'ASC' },
    });

    const items = await Promise.all(
      roles.map((role) => this.mapRoleToResponseDto(role)),
    );

    return {
      items,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    };
  }

  // async findAll(page = 1, limit = 10) {
  //   const pageNumber = Math.max(1, Number(page) || 1);
  //   const limitNumber = Math.max(1, Number(limit) || 10);

  //   const qb = this.roleRepository
  //     .createQueryBuilder('role')
  //     .leftJoinAndSelect(
  //       'users',
  //       'createdByUser',
  //       'createdByUser.id = role.created_by',
  //     )
  //     .leftJoinAndSelect(
  //       'users',
  //       'updatedByUser',
  //       'updatedByUser.id = role.updated_by',
  //     )
  //     .skip((pageNumber - 1) * limitNumber)
  //     .take(limitNumber)
  //     .orderBy('role.id', 'ASC');

  //   const [roles, total] = await qb.getManyAndCount();

  //   const items = roles.map((role) =>
  //     this.mapRoleToListDto(
  //       role,
  //       (role as any).createdByUser,
  //       (role as any).updatedByUser,
  //     ),
  //   );

  //   return {
  //     items,
  //     total,
  //     page: pageNumber,
  //     limit: limitNumber,
  //     totalPages: Math.ceil(total / limitNumber),
  //   };
  // }

  // async findOne(id: number) {
  //   const role = await this.roleRepository.findOne({
  //     where: { id },
  //     relations: ['rolePermissions', 'rolePermissions.permission'],
  //   });

  //   if (!role) throw new NotFoundException('Role not found');
  //   return role;
  // }

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
    // 1. Tìm role
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    // 2. Kiểm tra user cập nhật
    const updatedUser = await this.userRepo.findOne({
      where: { id: dto.updatedUserId },
    });
    if (!updatedUser)
      throw new NotFoundException(`User ${dto.updatedUserId} not found`);

    // 3. Nếu gửi lên key mới → check key có bị trùng
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

    // 4. Gán dữ liệu
    Object.assign(role, dto);

    // 5. Gán người cập nhật
    role.updatedBy = dto.updatedUserId;

    // 6. Lưu lại
    return this.roleRepository.save(role);
  }

  async delete(id: number) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    await this.roleRepository.delete(id);
    return { message: 'Role deleted successfully' };
  }

  private mapRoleToListDto(
    role: Role,
    createdByUser?: User,
    updatedByUser?: User,
  ): RoleListResponseDto {
    return {
      id: role.id,
      name: role.name,
      key: role.key,
      description: role.description,

      createdBy: createdByUser?.username || '',
      createdAt: role.createdAt,

      updatedBy: updatedByUser?.username || '',
      updatedAt: role.updatedAt,
    };
  }

  private async mapRoleToResponseDto(role: Role): Promise<RoleResponseDto> {
    const createdByUsername = role.createdBy
      ? (await this.userRepo.findOne({ where: { id: role.createdBy } }))
          ?.username || ''
      : '';

    const updatedByUsername = role.updatedBy
      ? (await this.userRepo.findOne({ where: { id: role.updatedBy } }))
          ?.username || ''
      : '';

    const permissions = role.rolePermissions?.map((rp) => rp.permission) || [];

    return Object.assign(new RoleResponseDto(), {
      id: role.id,
      name: role.name,
      key: role.key,
      description: role.description,

      createdBy: createdByUsername,
      createdAt: role.createdAt,

      updatedBy: updatedByUsername,
      updatedAt: role.updatedAt,

      permissions: permissions,
    });
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
