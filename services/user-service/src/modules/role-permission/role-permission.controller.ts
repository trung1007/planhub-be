// src/modules/role-permissions/role-permissions.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';
import { RolePermissionService } from './role-permission.service';

@Controller('role-permissions')
export class RolePermissionController {
  constructor(private readonly service: RolePermissionService) {}

  @Post()
  create(@Body() dto: CreateRolePermissionDto) {
    return this.service.create(dto);
  }

  @Get(':roleId')
  getPermissionsByRole(
    @Param('roleId') roleId: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.service.getPermissionsByRole(roleId, page, limit);
  }
  @Get('role-permissionIds/:roleId')
  getAllRolePermissionIds(@Param('roleId') roleId: number) {
    return this.service.getAllRolePermissionIds(roleId);
  }

  @Get('role/:roleId')
  getPermissionsByRoleId(@Param('roleId') roleId: number) {
    return this.service.getPermissionsByRoleId(roleId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRolePermissionDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':roleId')
  remove(
    @Param('roleId') roleId: string,
    @Query('permissionIds') permissionIds: string,
  ) {
    const ids = permissionIds
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => !isNaN(v));

    return this.service.remove({
      role_id: Number(roleId),
      permissionIds: ids,
    });
  }
}
