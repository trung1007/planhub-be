import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';

import { SprintService } from './sprint.service';
import { ActionSprintDto } from './dto/action-sprint.dto';
@Controller('sprints')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  async create(@Body() dto: ActionSprintDto) {
    return this.sprintService.create(dto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.sprintService.findAll(Number(page), Number(limit));
  }

  @Get('sprint-list')
  findList() {
    return this.sprintService.findList();
  }

  @Get('active-sprints/:projectId')
  async findActiveSprints(@Param('projectId') projectId: number) {
    return this.sprintService.findActiveSprintByProject(projectId);
  }

  @Get('active-sprints')
  findActiveSprint() {
    return this.sprintService.findActiveSprint();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActionSprintDto,
  ) {
    return this.sprintService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.sprintService.delete(id);
  }
}
