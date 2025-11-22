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
import { CreateProjectMemberDto } from './dto/create-project-member.dto';

@Controller('project-members')
export class ProjectMemberController {
  constructor(private readonly service: ProjectMemberService) {}

  /** ===================== CREATE ===================== */
  @Post()
  create(@Body() dto: CreateProjectMemberDto) {
    return this.service.create(dto);
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
  update(@Param('id') id: number, @Body() dto: any) {
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
