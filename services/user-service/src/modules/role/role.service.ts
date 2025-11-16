import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Role } from './role.entity';
import { Permission } from '../permission/permission.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';


@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async findAll() {
    return this.roleRepository.find({
      relations: ['permissions'],
    });
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
    const { permissionIds, ...data } = dto;

    const permissions = permissionIds
      ? await this.permissionRepository.find({ where: { id: In(permissionIds) } })
      : [];

    const role = this.roleRepository.create({
      ...data,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) throw new NotFoundException('Role not found');

    const { permissionIds, ...data } = dto;

    if (permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
      role.permissions = permissions;
    }

    Object.assign(role, data);

    return this.roleRepository.save(role);
  }

  async delete(id: number) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    await this.roleRepository.delete(id);
    return { message: 'Role deleted successfully' };
  }
}
