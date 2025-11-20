import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionRepository.create(dto);
    return this.permissionRepository.save(permission);
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.permissionRepository.findAndCount({
      relations: ['roles'], // nếu bạn muốn load roles
      skip,
      take: limit,
      order: { id: 'ASC' }, // tuỳ chọn
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }
  async getAllIds(): Promise<{ ids: number[] }> {
    const list = await this.permissionRepository.find({
      select: ['id'], // chỉ lấy ID
    });

    return {
      ids: list.map((i) => i.id),
    };
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!permission) {
      throw new NotFoundException(`Permission #${id} not found`);
    }

    return permission;
  }

  async update(id: number, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    Object.assign(permission, dto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }
}
