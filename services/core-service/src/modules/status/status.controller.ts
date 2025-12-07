import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Req,
} from '@nestjs/common';
import { StatusService } from './status.service';
import { CreateStatusDto, UpdateStatusDto } from './dto/status.dto';

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get('workflow/:workflowId')
  findAll(@Param('workflowId') workflowId: number) {
    return this.statusService.findAll(workflowId);
  }

  @Get('sprint/:sprintId') // API để lấy list status theo sprintId
  findAllBySprintId(@Param('sprintId') sprintId: number) {
    return this.statusService.findAllBySprintId(sprintId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.statusService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStatusDto, @Req() req) {
    const user_id = Number(req.headers['x-user-id']);
    return this.statusService.create(dto, user_id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateStatusDto) {
    return this.statusService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.statusService.remove(id);
  }
}
