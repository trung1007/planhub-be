// workflow.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './create-workflow.dto';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.workflowService.findAll(Number(page), Number(limit));
  }
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.workflowService.findOne(id);
  }

  @Post()
  async createWorkflow(@Body() payload: CreateWorkflowDto, @Req() req) {
    const user_id = Number(req.headers['x-user-id']);
    return this.workflowService.createWorkflow(payload, user_id);
  }

  @Patch(':id')
  async updatedWorkflow(
    @Param('id') id: number,
    @Body() payload: CreateWorkflowDto,
    @Req() req,
  ) {
    const user_id = Number(req.headers['x-user-id']);
    return this.workflowService.updateWorkflow(id, payload, user_id);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @Req() req) {
    const user_id = Number(req.headers['x-user-id']);
    return this.workflowService.remove(id, user_id);
  }
}
