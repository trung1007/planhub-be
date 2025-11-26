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
import { IssueService } from './issue.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { AssignIssuesToSprintDto } from './dto/add-issue-to-sprint.dto';

@Controller('issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Get()
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.issueService.findAll(page, limit);
  }

  @Get('all-ids')
  getAllIds() {
    return this.issueService.getAllIds();
  }

  @Get('issue-list')
  getIssueList() {
    return this.issueService.getListIssue();
  }

  @Get(':id/subtasks')
  findSubtasks(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const parentId = Number(id);
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;

    return this.issueService.findSubtasks(parentId, pageNumber, limitNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.issueService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateIssueDto) {
    return this.issueService.create(dto);
  }

  @Patch('assign-to-sprint')
  assignIssuesToSprint(@Body() dto: AssignIssuesToSprintDto) {
    return this.issueService.assignIssuesToSprint(dto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateIssueDto) {
    return this.issueService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.issueService.remove(id);
  }
}
