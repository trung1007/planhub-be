import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { TransitionService } from './transition.service';
import { CreateTransitionDto, UpdateTransitionDto } from './dto/transition.dto';

@Controller('transition')
export class TransitionController {
  constructor(private readonly transitionService: TransitionService) {}

  @Get('workflow/:workflowId')
  findAll(@Param('workflowId') workflowId: number) {
    return this.transitionService.findAll(workflowId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.transitionService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTransitionDto) {
    return this.transitionService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateTransitionDto) {
    return this.transitionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.transitionService.remove(id);
  }
}
