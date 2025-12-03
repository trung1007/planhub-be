// workflow.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
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
}
