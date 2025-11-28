import { Controller, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { IssueHistoryService } from './issue-history.service';

@Controller('issue-history')
export class IssueHistoryController {
  constructor(private historyService: IssueHistoryService) {}

  @Get(':issueId')
  async getHistory(
    @Param('issueId') issueId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.historyService.getByIssue(issueId, Number(page), Number(limit));
  }
}
