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

  // async findAll() {
  //   return this.roleRepository.find({
  //     relations: ['permissions'],
  //   });
  // }

  async findAll(page = 1, limit = 10) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);

    // Query lấy dữ liệu + đếm tổng
    const [roles, total] = await this.roleRepository.findAndCount({
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      order: { id: 'ASC' },
      relations: ['permissions'],
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

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
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
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Gán các trường được gửi lên
    Object.assign(role, dto);

    return this.roleRepository.save(role);
  }

  async delete(id: number) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    await this.roleRepository.delete(id);
    return { message: 'Role deleted successfully' };
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

    return Object.assign(new RoleResponseDto(), {
      id: role.id,
      name: role.name,
      key: role.key,
      description: role.description,

      createdBy: createdByUsername,
      createdAt: role.createdAt,

      updatedBy: updatedByUsername,
      updatedAt: role.updatedAt,

      permissions: role.permissions || [],
    });
  }
}
