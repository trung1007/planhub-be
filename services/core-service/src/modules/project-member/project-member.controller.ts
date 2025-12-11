import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ProjectMemberService } from './project-member.service';
import { ActionProjectMemberDto } from './dto/create-project-member.dto';

@Controller('project-members')
export class ProjectMemberController {
  constructor(private readonly service: ProjectMemberService) {}

  /** ===================== CREATE ===================== */
  @Post()
  create(@Body() dto: ActionProjectMemberDto) {
    return this.service.create(dto);
  }

  @Get('role-permissions')
  getUserPermissions(
    @Query('projectId') projectId: number,
    @Query('userId') userId: number,
  ) {
    return this.service.getUserPermissions(
      Number(projectId),
      Number(userId),
    );
  }

  @Get('member-role/:userId')
  getRoleByUserId(@Param('userId') userId: number) {
    return this.service.getRoleByUserId(userId);
  }

  /** ===================== GET LIST ===================== */
  @Get()
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.service.findAll(Number(page), Number(limit));
  }

  /** ===================== GET DETAIL ===================== */
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(Number(id));
  }

  /** ===================== UPDATE ===================== */
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: ActionProjectMemberDto) {
    return this.service.update(Number(id), dto);
  }

  /** ===================== DELETE ===================== */
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(Number(id));
  }

  /** ===================== GET ALL USER IDS BY PROJECT ===================== */
  @Get('project/:projectId/user-ids')
  getAllUserIds(@Param('projectId') projectId: number) {
    return this.service.getAllUserIds(Number(projectId));
  }
}
